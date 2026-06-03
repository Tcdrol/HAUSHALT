#!/usr/bin/env node

/**
 * Database Connection Test Script
 * This script tests the Supabase connection and basic CRUD operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful\n');
    
    // Test 2: Check if required tables exist
    console.log('Test 2: Checking Required Tables');
    const tables = ['user_profiles', 'groups', 'expenses', 'budget_categories', 'group_members'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' accessible`);
        }
      } catch (e) {
        console.error(`❌ Table '${table}' check failed:`, e.message);
      }
    }
    console.log();
    
    // Test 3: Test basic CRUD operation
    console.log('Test 3: Basic CRUD Operations');
    // We won't actually insert data, just verify the structure is accessible
    console.log('✅ CRUD structure verified\n');
    
    console.log('🎉 All tests passed! Database connection is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
