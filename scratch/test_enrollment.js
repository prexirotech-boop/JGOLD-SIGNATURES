import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `student_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  console.log(`Creating test user with email: ${email}`);

  // 1. Sign up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Enrollment Student'
      }
    }
  });

  if (authError) {
    console.error('Sign up failed:', authError);
    return;
  }

  const user = authData.user;
  console.log('User signed up successfully. ID:', user.id);

  // Get a course ID to enroll in
  console.log('Fetching a course...');
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .limit(1);

  if (courseError) {
    console.error('Failed to fetch courses:', courseError);
    return;
  }

  if (!courses || courses.length === 0) {
    console.error('No courses found in database.');
    return;
  }

  const course = courses[0];
  console.log(`Selected course: "${course.title}" (${course.id})`);

  // 2. Try to insert enrollment
  console.log('Attempting to insert enrollment...');
  const { data: insertData, error: insertError } = await supabase
    .from('enrollments')
    .insert({ user_id: user.id, course_id: course.id, progress: [] })
    .select();

  console.log('Insert Result data:', insertData);
  console.log('Insert Result error:', insertError);

  if (insertError) {
    console.log('JSON error details:', JSON.stringify(insertError, null, 2));
  } else {
    // 3. Try to select the enrollment
    console.log('Attempting to select the enrollment...');
    const { data: selectData, error: selectError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course.id);

    console.log('Select Result data:', selectData);
    console.log('Select Result error:', selectError);
  }
}

run();
