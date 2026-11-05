const { WarEraService } = require('../services/wareraApi.js');
const api = new WarEraService();

async function testManagerCalls() {
  const compId = '6ae4a9e87e0750611a45751e'; // Stainless Still
  
  console.log('Testing manager.getByCompanyId:');
  try {
    const res = await api.callTrpc('manager.getByCompanyId', { companyId: compId });
    console.log('manager.getByCompanyId result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('manager.getByCompanyId error:', e.message);
  }

  console.log('\nTesting managerOffer.getByCompanyId:');
  try {
    const res = await api.callTrpc('managerOffer.getByCompanyId', { companyId: compId });
    console.log('managerOffer.getByCompanyId result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('managerOffer.getByCompanyId error:', e.message);
  }

  console.log('\nTesting employee.getCompanyRoster:');
  try {
    const res = await api.callTrpc('employee.getCompanyRoster', { companyId: compId });
    console.log('employee.getCompanyRoster result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('employee.getCompanyRoster error:', e.message);
  }

  console.log('\nTesting manager.getMyJob:');
  try {
    const res = await api.callTrpc('manager.getMyJob', {});
    console.log('manager.getMyJob result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('manager.getMyJob error:', e.message);
  }
}

testManagerCalls().catch(console.error);
