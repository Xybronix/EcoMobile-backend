/**
 * Script de test pour la vérification SMS
 * 
 * Ce script teste l'envoi de SMS en mode développement
 * Usage: node scripts/test-sms.js
 */

require('dotenv').config();
const { SmsVerificationService } = require('../dist/services/SmsVerificationService');

async function testSms() {
  console.log('🧪 Test du service SMS\n');
  
  // Vérifier la configuration
  console.log('📋 Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   SMS_PROVIDER: ${process.env.SMS_PROVIDER || 'mock'}`);
  console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`   TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || '❌ Non configuré'}\n`);

  const smsService = new SmsVerificationService();
  const testPhone = '+237612345678';
  const testCode = '123456';
  const language = 'fr';

  console.log('📱 Test d\'envoi de SMS:');
  console.log(`   Numéro: ${testPhone}`);
  console.log(`   Code: ${testCode}`);
  console.log(`   Langue: ${language}\n`);

  try {
    await smsService.sendVerificationCode(testPhone, testCode, language);
    console.log('✅ Test réussi!');
    console.log('\n💡 En mode développement, le code devrait apparaître ci-dessus.');
    console.log('💡 En production avec Twilio configuré, le SMS sera réellement envoyé.\n');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testSms().catch(console.error);
