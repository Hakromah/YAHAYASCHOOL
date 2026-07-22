const strapi = require('@strapi/strapi').createStrapi();

strapi.start().then(async () => {
  const roleService = strapi.service('plugin::users-permissions.role');
  const roles = await roleService.find();
  const targetRoles = roles.filter(r => r.type === 'public' || r.type === 'authenticated');
  
  const hostelApis = [
    'hostel-setting', 'hostel-building', 'hostel-floor', 'hostel-room',
    'hostel-bed', 'hostel-fee-plan', 'hostel-allocation', 'hostel-invoice',
    'hostel-payment', 'hostel-vacation', 'hostel-deposit-refund',
    'hostel-gate-pass', 'hostel-visitor', 'hostel-maintenance-ticket',
    'hostel-attendance', 'hostel-warden', 'hostel-audit-log'
  ];
  
  for (const role of targetRoles) {
    const roleWithPerms = await roleService.findOne(role.id, { populate: ['permissions'] });
    
    for (const api of hostelApis) {
      const actions = ['find', 'findOne', 'create', 'update', 'delete'];
      for (const action of actions) {
        const actionString = `api::${api}.${api}.${action}`;
        const existing = roleWithPerms.permissions.find(p => p.action === actionString);
        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: actionString, role: role.id }
          });
          console.log(`Granted ${actionString} to ${role.type}`);
        }
      }
    }
  }
  
  console.log('Hostel API permissions granted successfully.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
