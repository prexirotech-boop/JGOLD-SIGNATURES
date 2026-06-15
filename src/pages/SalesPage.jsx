import Countdown from '../components/Countdown'
import FaqItem from '../components/FaqItem'
import ProgressBar from '../components/ProgressBar'
import { useReveal } from '../hooks/useReveal'
import { useToasts } from '../hooks/useToasts'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CONFIG } from '../lib/config'

const FAQS = [
  ["Do I need coding experience?", "Absolutely not. 90% of our successful students had zero technical background. We use modern drag-and-drop tools like Elementor and WordPress, which allow you to build stunning websites without writing a single line of code."],
  ["How fast can I start getting clients?", "If you follow Module 3 ('Client Avalanche System'), you can start seeing inbound leads within your first 14 days. Many of our students close their first ₦150k-₦300k deal before they even finish the program."],
  ["Is the ₦10,000 price a one-time payment?", "Yes! This is a single, one-time payment. You get lifetime access to the entire Mastery Program, all the bonuses, templates, and any future updates. No hidden fees or subscriptions."],
  ["What if I don't have a laptop?", "While having a laptop makes building websites much faster and easier, some of our students started by using cyber cafes or borrowing laptops just for the design phase, while handling all client communication and closing deals on their smartphones."],
  ["How is this different from YouTube tutorials?", "YouTube gives you scattered pieces of a puzzle. We give you the entire step-by-step roadmap. Plus, YouTube won't give you our proprietary Done-For-You templates, contracts, email scripts, or the exact pricing psychology to charge premium rates in Nigeria."],
  ["What happens after I pay?", "You'll instantly be redirected to create your account and access the Learning Management System (LMS). You can start watching the video modules and downloading the templates immediately."],
]

const TESTIMONIALS = [
  { name: 'Chidinma Okoro', role: 'Former Pharmacy Assistant, Lagos', text: "I used to cry every month when my salary couldn't cover rent. After Module 6 of the course, I landed my first client—a Nigerian bakery paying ₦350k for a simple WordPress E-commerce site! Now I've moved my parents out of our one-room apartment. The 'Client Avalanche System' is pure magic. Bosses who called me 'lazy'? I invoice them extra for rush projects!", result: '₦780k in 4 Months', img: 'chidinma' },
  { name: 'Ibrahim Suleiman', role: 'Unemployed Graduate, Kano', text: "I sent 300 job applications with zero replies. My sister used part of her salary to enroll me in this course. Within 3 weeks, I built a site for a Nigerian construction company using the drag-and-drop templates. Last month, I paid her back... with a 200% interest! The AI Proposal Generator alone is worth ₦1M. Now I'm saving to rent my mom a nice provision shop. No degree, no connections—just this course.", result: '₦1.2M in 6 Months', img: 'ibrahim' },
  { name: 'Grace Akpan', role: 'Retired Teacher, Uyo', text: "At 58, I thought my best days were over. My kids laughed when I said I'd learn web design. But the video tutorials were so simple—even I could follow! Now I create sites for churches and NGOs. Last week, I paid for my grandson's school fees in cash. My husband calls me 'Tech Pastor'! If I can do it with my 'old brain,' ANYONE can.", result: '₦450k/Month Consistently', img: 'grace' },
  { name: 'Tunde Adebayo', role: 'Former Uber Driver, Abuja', text: "I was drowning in debt, working 18-hour shifts. The 'Done-For-You Contracts' in the bonuses helped me land a ₦950k project with a Nigerian Real Estate Firm. Now I outsource the coding work and focus on client calls. Last month, I took my family to Mauritius—a trip I funded with ONE website project. My old Uber friends? They beg me for freelancing advice now!", result: '₦2.3M in 8 Months', img: 'tunde' },
]

export default function SalesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('product')
  useReveal()
  useToasts()
  const go = () => { 
    const target = productId ? `/checkout?product=${productId}` : '/checkout'
    navigate(target)
    window.scrollTo({ top: 0, behavior: 'smooth' }) 
  }

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', fontFamily: "var(--font)" }}>
      
      {/* ── URGENCY BAR ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--red)', color: '#fff', textAlign: 'center', padding: '10px 15px', fontSize: '.85rem', fontWeight: 700, position: 'sticky', top: 0, zIndex: 100, letterSpacing: '.5px' }}>
        🚨 WARNING: ONLY 37 SPOTS LEFT AT {CONFIG.PRICE_DISPLAY} (PRICE INCREASES TO {CONFIG.ORIGINAL_PRICE} SOON)
      </div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background Gradients */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />

        <div className="wrap t-center" style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ display: 'inline-block', background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', padding: '6px 16px', borderRadius: 50, fontSize: '.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24, border: '1px solid rgba(255,215,0,0.2)' }}>
            The Ultimate Escape Plan
          </p>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            How to Ditch the 9-to-5 Grind, <br />
            <span style={{ color: 'var(--red)', textShadow: '0 0 20px rgba(220,38,38,0.4)' }}>Fire Your Boss</span>, and Earn <br />
            <span style={{ color: 'var(--gold)' }}>₦500k/Month</span> From Your Living Room...
          </h1>
          
          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'rgba(255,255,255,0.7)', maxWidth: 800, margin: '0 auto 40px', lineHeight: 1.6 }}>
            ...Even If You're Broke, Overworked, Sick of Wasting Your Life, and Have <strong style={{color: '#fff'}}>ZERO Technical Skills.</strong>
          </p>

          {/* Video Placeholder / Graphic */}
          <div style={{ maxWidth: 800, margin: '0 auto 40px', background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', border: '1px solid #333', borderRadius: 20, padding: 8, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200) center/cover', opacity: 0.3 }} />
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 0 30px rgba(255,215,0,0.4)' }}>
                <span style={{ fontSize: '2rem', color: '#000', marginLeft: 6 }}>▶</span>
              </div>
              <p style={{ zIndex: 2, marginTop: 16, fontWeight: 600, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Click to Watch The Free Presentation</p>
            </div>
          </div>

          {/* CTA Button */}
          <button onClick={go} style={{ background: 'linear-gradient(to right, var(--gold), #ffb700)', color: '#000', border: 'none', padding: '20px 40px', borderRadius: 50, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,215,0,0.3)', transition: 'transform 0.2s', transform: 'scale(1)', animation: 'pulse 2s infinite' }}>
            YES! I Want My Freedom Now ({CONFIG.PRICE_DISPLAY}) <span style={{ marginLeft: 8 }}>→</span>
          </button>
          
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: '.85rem', color: 'rgba(255,255,255,0.5)' }}>
            <span>🔒 Secure Checkout</span>
            <span>•</span>
            <span>⚡ Instant Access</span>
            <span>•</span>
            <span>💯 30-Day Guarantee</span>
          </div>
        </div>
      </section>

      {/* ── THE STORY ───────────────────────────────────────────── */}
      <section style={{ padding: '60px 20px', background: '#111' }}>
        <div className="wrap reveal" style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: 24 }}>"This Could Be Your Last Monday Morning…"</h2>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #333', paddingBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#000', fontWeight: 'bold' }}>NP</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>By Nnanta Precious</p>
              <p style={{ color: 'var(--gold)', fontSize: '.9rem' }}>Founder, Amplified Skills</p>
              <p style={{ color: '#888', fontSize: '.8rem' }}>📍 7:43 PM, Lagos</p>
            </div>
          </div>

          <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#ccc' }}>
            <p style={{ marginBottom: 20 }}>You're jolted awake by the screech of your alarm. <strong>6:15 AM. Again.</strong></p>
            <p style={{ marginBottom: 20 }}>Your throat is dry. Your head throbs. You hit snooze, but it's no use. In 45 minutes, you'll be stuck in that traffic. Again. Squeezed between sweating bodies in a danfo, inhaling exhaust fumes, praying the boss won't notice you're late... Again.</p>
            
            <div style={{ padding: '20px', background: 'rgba(220,38,38,0.1)', borderLeft: '4px solid var(--red)', margin: '30px 0', borderRadius: '0 8px 8px 0' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: 10 }}>Sound Familiar?</h3>
              <p>Hi. I'm Nnanta. Five years ago, I was you.</p>
            </div>

            <p style={{ marginBottom: 20 }}>I'll never forget the day I collapsed at my desk. 12-hour shifts. A micromanaging boss who mocked my "useless degree." A salary that vanished before month-end.</p>
            <p style={{ marginBottom: 20 }}>One morning, my body said "enough." When I woke up in the hospital, my mother was crying.</p>
            <p style={{ fontStyle: 'italic', color: '#fff', fontSize: '1.2rem', marginBottom: 20 }}>"Is this really what I worked two jobs to send you to school for?"</p>
            <p style={{ marginBottom: 20 }}>That day, I made a promise: <strong>"I will find a way out... or die trying."</strong></p>
          </div>
        </div>
      </section>

      {/* ── THE LIES ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#0a0a0a' }}>
        <div className="wrap reveal">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: '3rem' }}>🚩</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>The 3 Lies They Sold Us <br /><span style={{ color: 'var(--red)' }}>(That Are Keeping You Poor)</span></h2>
          </div>

          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { num: 1, title: '“Work hard, get promoted, and life gets better.”', truth: 'Promotions go to the boss’s nephew. Your “reward” for loyalty? More work.' },
              { num: 2, title: '“Your degree guarantees security.”', truth: '72% of Nigerian graduates are underemployed. You’re not failing—the system is rigged.' },
              { num: 3, title: '“You should feel lucky to have any job.”', truth: 'You’re a modern-day slave. Trading your health, time, and dignity for crumbs.' },
            ].map((lie) => (
              <div key={lie.num} style={{ background: '#111', border: '1px solid #333', padding: 30, borderRadius: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -20, left: 30, background: 'var(--red)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>{lie.num}</div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, marginTop: 10 }}>Lie: {lie.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}><strong>Reality?</strong> {lie.truth}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SECRET / PARALLEL ECONOMY ──────────────────────── */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)' }}>
        <div className="wrap reveal">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 40 }}>But What If I Told You…</h2>
          
          <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', padding: 40, borderRadius: 20, maxWidth: 800, margin: '0 auto 60px' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: 20, textAlign: 'center' }}>There's a parallel economy where:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.1rem', color: '#ddd', lineHeight: 1.8 }}>
              <li style={{ marginBottom: 15, display: 'flex', gap: 10 }}><span style={{ color: 'var(--gold)' }}>✓</span> 21-year-olds earn ₦500k/month designing websites… in pajamas.</li>
              <li style={{ marginBottom: 15, display: 'flex', gap: 10 }}><span style={{ color: 'var(--gold)' }}>✓</span> Single mothers quit toxic jobs to homeschool kids and triple their income.</li>
              <li style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--gold)' }}>✓</span> Students pay tuition in cash—no more “Mummy, send me alert.”</li>
            </ul>
          </div>

          <div className="grid-2" style={{ alignItems: 'center', gap: 40, maxWidth: 900, margin: '0 auto' }}>
            <div>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Meet Temitope.</h3>
              <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: 16, lineHeight: 1.6 }}>Last year, she was a 300-level Microbiology student drowning in debt. Today? She's a Top-Rated Freelancer.</p>
              <div style={{ background: '#000', padding: 20, borderRadius: 12, borderLeft: '4px solid var(--gold)' }}>
                <p style={{ color: '#aaa', marginBottom: 8 }}>Her Last Project:</p>
                <p style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 700, marginBottom: 8 }}>₦620,000</p>
                <p style={{ color: '#ccc', fontSize: '.9rem' }}>To redesign an electronics e-commerce store website.</p>
                <div style={{ marginTop: 12, display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 4, fontSize: '.85rem', color: 'var(--gold)' }}>Time Spent: 9 days</div>
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 30, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '4rem', opacity: 0.2 }}>🤫</div>
              <h4 style={{ color: 'var(--gold)', fontSize: '1.2rem', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>The Secret They Don't Teach in School</h4>
              <p style={{ marginBottom: 12, fontSize: '1.05rem', color: '#fff' }}><strong>Fact:</strong> 90% of businesses NEED websites but HATE dealing with coders.</p>
              <p style={{ marginBottom: 12, fontSize: '1.05rem', color: '#fff' }}><strong>Fact:</strong> Tools like WordPress and Elementor let you build sites without coding—just drag, drop, done.</p>
              <p style={{ fontSize: '1.05rem', color: '#fff' }}><strong>Fact:</strong> Clients pay ₦150k–₦1.2M PER PROJECT for this.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── THE PROGRAM ────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#111' }}>
        <div className="wrap reveal">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>That's why I created...</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase' }}>THE FREELANCE WEB DESIGN <span style={{ color: 'var(--gold)' }}>MASTERY PROGRAM</span></h2>
            <p style={{ fontSize: '1.2rem', color: '#aaa', marginTop: 16 }}>Your Step-by-Step Blueprint to Escape the Rat Race in 30 Days… Guaranteed.</p>
            <p style={{ display: 'inline-block', marginTop: 24, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 50, border: '1px solid #333', color: '#fff', fontWeight: 600 }}>🎟️ "This Isn't a Course—It's a Golden Ticket"</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {/* Module 1 */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, padding: 30, display: 'flex', gap: 20 }}>
              <div style={{ fontSize: '2.5rem' }}>🔥</div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: 12 }}>MODULE 1: The "No-Experience" Launchpad</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#bbb', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 8 }}>✓ <strong>3 Plug-and-Play Website Templates</strong> (worth ₦150k) – Your first projects are DONE.</li>
                  <li>✓ <strong>The 1-Homework</strong> That Landed Me My First ₦150k Client (steal my exact script).</li>
                </ul>
              </div>
            </div>

            {/* Module 2 */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, padding: 30, display: 'flex', gap: 20 }}>
              <div style={{ fontSize: '2.5rem' }}>💸</div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: 12 }}>MODULE 2: The "Charge Premium" Playbook</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#bbb', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 8 }}>✓ <strong>Positioning Secrets:</strong> How to position yourself as an expert (even if you're new).</li>
                  <li>✓ <strong>Pricing Psychology:</strong> Why charging ₦300k attracts BETTER clients than ₦50k.</li>
                </ul>
              </div>
            </div>

            {/* Module 3 */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, padding: 30, display: 'flex', gap: 20 }}>
              <div style={{ fontSize: '2.5rem' }}>🚀</div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: 12 }}>MODULE 3: Client Avalanche & Facebook Ads System</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#bbb', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 8 }}>✓ <strong>Profitable Facebook Ads:</strong> My "3-Day Facebook Hack" to get 5–7 inbound leads weekly.</li>
                  <li style={{ marginBottom: 8 }}>✓ <strong>Closing the Deal:</strong> The "Dumb Phone Trick" and scripts that convince 79% of prospects to hire you.</li>
                  <li>✓ <strong>Recurring Revenue:</strong> How to make clients pay you monthly for maintenance.</li>
                </ul>
              </div>
            </div>

            {/* Bonuses */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 16, padding: 30, display: 'flex', gap: 20 }}>
              <div style={{ fontSize: '2.5rem' }}>🎁</div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--gold)', marginBottom: 12 }}>EXCLUSIVE BONUSES:</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#ddd', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 8 }}>✓ <strong>Lifetime Access to Our Client Portal</strong> (post a project, get bids in 1 hour).</li>
                  <li style={{ marginBottom: 8 }}>✓ <strong>30 "Shut Up and Take My Money" Email Templates</strong> (for late-paying clients).</li>
                  <li style={{ marginBottom: 8 }}>✓ <strong>AI Prompt Library:</strong> Use AI to build websites faster and deliver in days, not weeks.</li>
                  <li>✓ <strong>Done-For-You Contracts:</strong> Protect yourself and look professional instantly.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS & PROOF ───────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#0a0a0a' }}>
        <div className="wrap reveal">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>Don't Just Take My Word For It.</h2>
            <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: 10 }}>See what our students are doing right now.</p>
          </div>

          <div className="grid-2" style={{ gap: 30 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                      <img src={`/avatars/${t.img}.png`} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = t.name[0]; }} />
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>{t.name}</h4>
                      <p style={{ color: '#888', fontSize: '.85rem', margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(60,179,113,0.1)', color: '#6EE7A0', padding: '4px 10px', borderRadius: 6, fontSize: '.8rem', fontWeight: 700 }}>
                    {t.result}
                  </div>
                </div>
                <div style={{ color: '#ccc', lineHeight: 1.6, fontSize: '.95rem', flex: 1 }}>"{t.text}"</div>
                <div style={{ color: 'var(--gold)', marginTop: 16, fontSize: '1.2rem' }}>★★★★★</div>
              </div>
            ))}
          </div>

          {/* Payment Proof Placeholders */}
          <div style={{ marginTop: 60, textAlign: 'center' }}>
             <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>Real Deposits Hitting Student Accounts Every Week:</p>
             <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* Simulated receipts since we don't have the actual images in public/ */}
                {[
                  { bank: 'OPay', amount: '₦250,000.00', date: 'Nov 16, 2024' },
                  { bank: 'FCMB', amount: '₦340,000.00', date: 'Oct 17, 2024' },
                  { bank: 'OPay', amount: '₦550,000.00', date: 'Dec 04, 2024' },
                  { bank: 'OPay', amount: '₦300,000.00', date: 'Dec 11, 2024' }
                ].map((r, i) => (
                  <div key={i} style={{ background: '#fff', width: 220, borderRadius: 12, padding: 16, textAlign: 'left', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', border: '1px solid #e0e0e0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                       <span style={{ fontWeight: 900, color: r.bank === 'OPay' ? '#00b57e' : '#5b2b82' }}>{r.bank}</span>
                       <span style={{ fontSize: '.7rem', color: '#888' }}>Receipt</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: r.bank === 'OPay' ? '#00b57e' : '#d32f2f', marginBottom: 4 }}>{r.amount}</div>
                    <div style={{ fontSize: '.75rem', color: '#666', borderBottom: '1px dashed #ccc', paddingBottom: 10, marginBottom: 10 }}>Successful • {r.date}</div>
                    <div style={{ fontSize: '.7rem', color: '#444' }}>
                      <p>Recipient: PRECIOUS CHINONSO...</p>
                      <p style={{ marginTop: 4, color: '#888' }}>Remark: Web Services Payment</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE & OBJECTIONS ──────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#111' }}>
        <div className="wrap reveal">
          <div style={{ background: 'linear-gradient(145deg, rgba(220,38,38,0.1), rgba(0,0,0,0))', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛡️</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: 16 }}>"But Nnanta—What If I Fail?"</h2>
            <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: 24, lineHeight: 1.6 }}>
              I've Been There. My first client? A disaster. I spent 3 weeks on a site… he hated it. I refunded his money, cried for hours. Then I Discovered the Missing Piece: Most freelancers focus on skills… but neglect client psychology.
            </p>
            <div style={{ textAlign: 'left', background: '#0a0a0a', padding: 24, borderRadius: 12, border: '1px solid #333' }}>
              <p style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>That's why this program includes:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#bbb', lineHeight: 1.8 }}>
                <li>✅ <strong>Weekly Live Q&A Sessions:</strong> Stuck? Screenshare with me. I'll fix it LIVE.</li>
                <li>✅ <strong>365-Day Access:</strong> Learn at your pace. Rewatch as needed.</li>
                <li>✅ <strong>Ironclad Guarantee:</strong> Earn at least ₦200k within 90 days… or get 200% refund.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING & CLOSING ──────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#0a0a0a' }}>
        <div className="wrap reveal">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>"This Price Feels Too Good to Be True..."</h2>
            <p style={{ fontSize: '1.1rem', color: '#aaa', marginTop: 16 }}>What's Your Freedom Worth?</p>
          </div>

          <div style={{ maxWidth: 600, margin: '0 auto', background: 'linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,1) 100%)', border: '2px solid var(--gold)', borderRadius: 24, padding: 40, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 20, right: -40, background: 'var(--red)', color: '#fff', padding: '5px 40px', transform: 'rotate(45deg)', fontWeight: 800, fontSize: '.8rem', letterSpacing: 1 }}>90% OFF</div>
            
            <p style={{ color: '#ccc', textDecoration: 'line-through', fontSize: '1.2rem', marginBottom: 8 }}>Regular Price: {CONFIG.ORIGINAL_PRICE}</p>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1, marginBottom: 24 }}>{CONFIG.PRICE_DISPLAY}</div>
            
            <p style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 30, lineHeight: 1.6 }}>
              <strong>"Why So Low?"</strong><br/>
              Because I remember being the broke student. The single mom pawning jewelry to pay rent. The guy who almost died chasing a dream that wasn't his.<br/>
              <em style={{ color: 'var(--gold)' }}>This Isn't a Business—It's a Movement.</em>
            </p>

            <button onClick={go} style={{ width: '100%', background: 'linear-gradient(to right, var(--gold), #ffb700)', color: '#000', border: 'none', padding: '20px', borderRadius: 12, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,215,0,0.2)', transition: 'transform 0.2s' }}>
              SECURE MY SPOT NOW →
            </button>
            <div style={{ marginTop: 16 }}>
              <Countdown />
              <p style={{ color: 'var(--red)', fontWeight: 700, fontSize: '.9rem', marginTop: 12 }}>Warning: Only 37 spots left. I personally mentor every student.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: '#111' }}>
        <div className="wrap reveal">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>Questions? We Have Answers.</h2>
          </div>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {FAQS.map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section style={{ padding: '100px 20px', background: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000) center/cover', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)' }} />
        <div className="wrap reveal t-center" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: 24, lineHeight: 1.2 }}>
            In 30 days, you'll either:
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto 40px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(60,179,113,0.1)', border: '1px solid rgba(60,179,113,0.3)', padding: 20, borderRadius: 12 }}>
              <p style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}><span style={{ color: '#6EE7A0', marginRight: 10 }}>A)</span> Be celebrating your first ₦200k project...</p>
            </div>
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', padding: 20, borderRadius: 12 }}>
              <p style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}><span style={{ color: 'var(--red)', marginRight: 10 }}>B)</span> Still stuck in traffic, wondering "what if?"</p>
            </div>
          </div>
          <p style={{ fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 900, marginBottom: 30 }}>Choose A.</p>
          <button onClick={go} style={{ background: 'linear-gradient(to right, var(--gold), #ffb700)', color: '#000', border: 'none', padding: '20px 50px', borderRadius: 50, fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 40px rgba(255,215,0,0.4)' }}>
            YES! I Want My Freedom Now
          </button>
        </div>
      </section>

    </div>
  )
}
