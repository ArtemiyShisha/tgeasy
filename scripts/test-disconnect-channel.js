/**
 * Test script for channel disconnect functionality
 * 
 * Usage: node scripts/test-disconnect-channel.js [channel_id]
 */

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

async function testChannelDisconnect(channelId) {
  console.log('🔗 Testing Channel Disconnect API');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🆔 Channel ID:', channelId);
  console.log('');

  try {
    // Test disconnect
    console.log('📤 Calling POST /api/channels/{id}/disconnect...');
    const response = await fetch(`${BASE_URL}/api/channels/${channelId}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const responseData = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📥 Response Body:', JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.success) {
      console.log('✅ Channel disconnect test PASSED');
      console.log('✨ Channel disconnected successfully!');
    } else {
      console.log('❌ Channel disconnect test FAILED');
      console.log('🔴 Error:', responseData.error || 'Unknown error');
    }

  } catch (error) {
    console.log('💥 Network/Request Error:', error.message);
    console.log('❌ Test FAILED due to network error');
  }
}

async function testChannelList() {
  console.log('🔗 Testing Channel List API (to see available channels)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/channels`);
    const responseData = await response.json();
    
    console.log('📥 Available Channels:');
    if (responseData.success && responseData.data && responseData.data.channels) {
      responseData.data.channels.forEach((channel, index) => {
        console.log(`  ${index + 1}. ${channel.channel_title} (ID: ${channel.id})`);
      });
    } else {
      console.log('  No channels found or error occurred');
    }
    console.log('');
    
  } catch (error) {
    console.log('💥 Error fetching channel list:', error.message);
  }
}

// Main execution
async function main() {
  const channelId = process.argv[2];
  
  if (!channelId) {
    console.log('❌ Please provide a channel ID as argument');
    console.log('📋 Usage: node scripts/test-disconnect-channel.js [channel_id]');
    console.log('');
    
    // Show available channels
    await testChannelList();
    return;
  }

  // Test disconnect with provided channel ID
  await testChannelDisconnect(channelId);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testChannelDisconnect, testChannelList }; 