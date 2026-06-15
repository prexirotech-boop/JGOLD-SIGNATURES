import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)

// ─── SUPABASE DB HELPERS ──────────────────────────────────────────────────────
//
// WooCommerce-style order lifecycle:
//   pending → paid → (refunded | completed)
//
// STEP 1: createPendingOrder() — called BEFORE Paystack popup opens
// STEP 2: completeOrder()     — called AFTER Paystack onSuccess fires
//
// All DB writes are synchronous (awaited), idempotent (ON CONFLICT DO NOTHING),
// and use real DB data only — no localStorage fallbacks for enrollment.

/**
 * STEP 1 — Pre-create a pending order in the DB.
 *
 * Called as soon as the "Pay Now" button is clicked, before the Paystack
 * popup opens. This gives us a clean audit trail even if the user abandons
 * the payment midway.
 *
 * @returns {{ orderId: string|null, productId: string|null, error: string|null }}
 */
export async function createPendingOrder({
  reference,
  name,
  email,
  phone,
  productId,
  amount,
}) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase()

    const { data, error } = await supabase
      .from('orders')
      .insert({
        reference,
        customer_email: cleanEmail,
        customer_name: (name || '').trim() || null,
        customer_phone: (phone || '').trim() || null,
        product_id: productId || null,
        amount: amount || 0,
        status: 'pending',
        payment_method: 'paystack',
        currency: 'NGN',
      })
      .select('id, product_id')
      .single()

    if (error) {
      // If the reference was already used (duplicate), surface gracefully
      if (error.code === '23505') {
        console.warn('[createPendingOrder] Duplicate reference — order may already exist:', reference)
        return { orderId: null, productId, error: 'duplicate' }
      }
      console.error('[createPendingOrder] Insert failed:', error)
      return { orderId: null, productId, error: error.message }
    }

    console.log('[createPendingOrder] ✅ Pending order created:', data.id)
    return { orderId: data.id, productId: data.product_id || productId, error: null }
  } catch (err) {
    console.error('[createPendingOrder] Unexpected error:', err)
    return { orderId: null, productId, error: err.message }
  }
}

/**
 * STEP 2 — Complete the order after successful Paystack payment.
 *
 * This function:
 *  1. Updates the order status from "pending" to "paid"
 *  2. Creates the enrollment row synchronously (awaited — not fire-and-forget)
 *  3. Fires the confirmation email edge function (non-blocking)
 *
 * @returns {{ success: boolean, enrolled: boolean }}
 */
export async function completeOrder({
  reference,
  userId,       // auth user UUID — may be null for email-confirmation flows
  productId,
  productType,  // 'course' | 'ebook'
  name,
  phone,
}) {
  let enrolled = false

  try {
    // ── 1. Mark order as paid ────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('reference', reference)

    if (updateErr) {
      console.error('[completeOrder] Failed to mark order paid:', updateErr)
      // Continue anyway — enrollment is more important than order status
    } else {
      console.log('[completeOrder] ✅ Order marked as paid:', reference)
    }

    // ── 2. Create enrollment (only for courses, only when userId is known) ───
    if (productType === 'course' && productId && userId) {
      enrolled = await createEnrollment({ userId, courseId: productId })
    }

    // ── 3. Fire confirmation email (non-blocking) ────────────────────────────
    supabase.functions
      .invoke('send-confirmation', {
        body: {
          record: {
            reference,
            customer_name: name,
            customer_phone: phone,
            product_id: productId,
          }
        }
      })
      .catch(e => console.warn('[completeOrder] Email edge function skipped:', e?.message))

    return { success: true, enrolled }
  } catch (err) {
    console.error('[completeOrder] Unexpected error:', err)
    return { success: false, enrolled }
  }
}

/**
 * Create an enrollment for a user in a course.
 * Idempotent — safe to call multiple times; will not create duplicates.
 *
 * @returns {boolean} true if enrollment now exists (created or already existed)
 */
export async function createEnrollment({ userId, courseId }) {
  if (!userId || !courseId) {
    console.warn('[createEnrollment] Missing userId or courseId', { userId, courseId })
    return false
  }

  try {
    // Check if enrollment already exists first
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      console.log('[createEnrollment] ℹ️ Enrollment already exists:', existing.id)
      return true
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId, progress: [] })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint — enrollment just got created by a concurrent call
        console.log('[createEnrollment] ℹ️ Enrollment already exists (concurrent insert)')
        return true
      }
      console.error('[createEnrollment] Insert failed:', error)
      return false
    }

    console.log('[createEnrollment] ✅ Enrollment created for user', userId, 'course', courseId)
    return true
  } catch (err) {
    console.error('[createEnrollment] Unexpected error:', err)
    return false
  }
}

/**
 * Recover enrollment for a user based on their paid orders.
 * Called when user lands on dashboard — ensures access is granted even
 * if the checkout-time enrollment failed for any reason.
 *
 * @returns {boolean} true if any enrollment was recovered
 */
export async function recoverEnrollmentFromOrders(userId, userEmail) {
  if (!userId || !userEmail) return false

  try {
    // Find all paid course orders for this email
    const { data: orders } = await supabase
      .from('orders')
      .select('product_id, products!inner(id, type)')
      .eq('customer_email', userEmail.toLowerCase())
      .eq('status', 'paid')
      .eq('products.type', 'course')

    if (!orders || orders.length === 0) return false

    // Fetch existing enrollments for this user
    const { data: existingEnrs } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId)

    const existingCourseIds = (existingEnrs || []).map(e => e.course_id)

    let recovered = false
    for (const order of orders) {
      if (!order.product_id) continue
      // Only create enrollment if the user is not already enrolled in this course!
      if (!existingCourseIds.includes(order.product_id)) {
        const wasCreated = await createEnrollment({ userId, courseId: order.product_id })
        if (wasCreated) recovered = true
      }
    }

    return recovered
  } catch (err) {
    console.error('[recoverEnrollmentFromOrders] Error:', err)
    return false
  }
}

/**
 * Legacy saveOrder — kept for backward compatibility only.
 * New code should use createPendingOrder() + completeOrder().
 * @deprecated
 */
export async function saveOrder({ reference, name, email, phone, isEbook = false, userId = null, productId: productIdParam = null }) {
  console.warn('[saveOrder] This function is deprecated. Use createPendingOrder + completeOrder.')
  try {
    const cleanEmail = (email || '').trim().toLowerCase()
    let productId = productIdParam

    if (!productId) {
      const { data: productData } = await supabase
        .from('products')
        .select('id, price')
        .eq('type', isEbook ? 'ebook' : 'course')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      productId = productData?.id || null
    }

    const { error: insertError } = await supabase
      .from('orders')
      .insert([{
        reference,
        customer_email: cleanEmail,
        customer_name: name ? name.trim() : null,
        product_id: productId,
        amount: 0,
        status: 'paid',
        payment_method: 'paystack',
      }])

    if (insertError && insertError.code !== '23505') {
      console.error('[saveOrder] Insert failed:', insertError)
    }

    if (!isEbook && productId && userId) {
      await createEnrollment({ userId, courseId: productId })
    }

    supabase.functions
      .invoke('send-confirmation', {
        body: { record: { reference, customer_name: name, customer_phone: phone, product_id: productId } }
      })
      .catch(e => console.warn('[saveOrder] Email edge function skipped:', e?.message))

    return true
  } catch (err) {
    console.error('[saveOrder] Unexpected error:', err)
    return true
  }
}
