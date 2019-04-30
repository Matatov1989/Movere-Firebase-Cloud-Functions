# Movere Firebase Cloud Functions


These functions connect with project M. Functions are stored and run in response to requests caused by deleting a user account and HTTPS requests in Firebase Cloud Function.

### Tasks:
- sending a reminder to users, which did not visit 3 months a program;
- keep database clean.

---

### Description:
cleanup user data - a script removes all data a user after him sign out.
reminder about visit - A script sends a notification FCM about the reminder to users, which did not visit 3 months a program
remove old events - A script removes all old events.
