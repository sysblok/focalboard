const environment = process.env.FOCALBOARD_ENVIRONMENT || 'dev'
export const isProduction = environment === 'prod'

export const adminsUsernamesString = process.env.FOCALBOARD_ADMINS || '';
export const adminUsernames = adminsUsernamesString ? adminsUsernamesString.split(',').map(username => username.trim()) : [];
