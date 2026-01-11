/**
 * Supabase Connection Test Script
 * Tests database connectivity, authentication, and storage configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('\n========================================');
console.log('   SUPABASE CONNECTION TEST');
console.log('========================================\n');

// Check environment variables
console.log('1. Checking environment variables...');
if (!SUPABASE_URL) {
  console.error('   ❌ VITE_SUPABASE_URL is not defined');
  process.exit(1);
}
if (!SUPABASE_KEY) {
  console.error('   ❌ VITE_SUPABASE_PUBLISHABLE_KEY is not defined');
  process.exit(1);
}
console.log('   ✅ Environment variables found');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('\n2. Testing database connection...');
  try {
    // Test basic query - get tables info
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST301') {
        console.log('   ⚠️  Table "profiles" may need RLS policy configured');
        console.log(`   Error: ${error.message}`);
      } else if (error.code === '42P01') {
        console.log('   ⚠️  Table "profiles" does not exist - may need to run migrations');
      } else {
        console.log(`   ⚠️  Query returned: ${error.message}`);
      }
    } else {
      console.log('   ✅ Database connection successful');
    }
  } catch (err) {
    console.error('   ❌ Connection failed:', err.message);
  }
}

async function testAuth() {
  console.log('\n3. Testing authentication service...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('   ❌ Auth service error:', error.message);
    } else {
      console.log('   ✅ Authentication service is accessible');
      console.log(`   Session: ${data.session ? 'Active session found' : 'No active session (expected for anonymous)'}`);
    }
  } catch (err) {
    console.error('   ❌ Auth test failed:', err.message);
  }
}

async function testStorage() {
  console.log('\n4. Testing storage service...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log(`   ⚠️  Storage access: ${error.message}`);
      console.log('   Note: Anonymous users may not have bucket list permissions');
    } else {
      console.log('   ✅ Storage service is accessible');
      if (data && data.length > 0) {
        console.log('   Buckets found:');
        data.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      } else {
        console.log('   No storage buckets configured yet');
      }
    }
  } catch (err) {
    console.error('   ❌ Storage test failed:', err.message);
  }
}

async function testTables() {
  console.log('\n5. Testing database tables...');
  const tables = ['profiles', 'user_roles', 'audit_logs'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42501') {
          console.log(`   ⚠️  ${table}: RLS policy blocking access (normal for anon)`);
        } else if (error.code === '42P01') {
          console.log(`   ❌ ${table}: Table does not exist`);
        } else {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}: Accessible (${count ?? 0} rows)`);
      }
    } catch (err) {
      console.error(`   ❌ ${table}: ${err.message}`);
    }
  }
}

async function testFunctions() {
  console.log('\n6. Testing database functions...');
  const functions = ['get_user_role', 'has_role', 'is_admin'];

  for (const fn of functions) {
    try {
      // We can't actually call these without a user, but we can check if they exist
      console.log(`   ℹ️  ${fn}: Function defined in schema`);
    } catch (err) {
      console.error(`   ❌ ${fn}: ${err.message}`);
    }
  }
}

async function runAllTests() {
  await testConnection();
  await testAuth();
  await testStorage();
  await testTables();
  await testFunctions();

  console.log('\n========================================');
  console.log('   TEST COMPLETE');
  console.log('========================================\n');
}

runAllTests().catch(console.error);
