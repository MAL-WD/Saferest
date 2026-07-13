import { useEffect } from 'react';
import { FiUser, FiLock, FiCreditCard, FiShield } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import styles from './Settings.module.css';

export default function Settings() {
  const { user } = useAuthStore();
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  useEffect(() => {
    document.title = 'Settings - Saferest AI';
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Settings</h2>
        <p>Manage your account, billing, and security preferences.</p>
      </div>

      <div className={styles.cards}>
        
        {/* Profile */}
        <div className="card">
          <div className={styles.cardHead}>
            <div className={`${styles.iconWrap} ${styles.profileIcon}`}>
              <FiUser size={20} />
            </div>
            <h3>Profile</h3>
          </div>
          <div className={styles.profileGrid}>
            <div><strong>Full Name:</strong></div>
            <div className={styles.value}>{user?.name}</div>
            <div><strong>Email Address:</strong></div>
            <div className={styles.value}>{user?.email}</div>
            <div><strong>Joined:</strong></div>
            <div className={styles.value}>{joinedDate}</div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className={styles.cardHead}>
            <div className={`${styles.iconWrap} ${styles.securityIcon}`}>
              <FiLock size={20} />
            </div>
            <h3>Security</h3>
          </div>
          <p style={{ marginBottom: 16 }}>Change your password or enable two-factor authentication.</p>
          <div className={styles.actions}>
            <button className="btn btn-primary">Change Password</button>
            <button className="btn btn-ghost" disabled>Enable 2FA (Coming Soon)</button>
          </div>
        </div>

        {/* Billing */}
        <div className="card">
          <div className={styles.cardHead}>
            <div className={`${styles.iconWrap} ${styles.billingIcon}`}>
              <FiCreditCard size={20} />
            </div>
            <h3>Subscription Plan</h3>
          </div>
          <div className={styles.planTag}>
            <div className={styles.planLabel}>
              <FiShield /> Pro Plan (Active)
            </div>
          </div>
          <p style={{ margin: 0 }}>You are currently on the unlimited early-access plan.</p>
        </div>

      </div>
    </div>
  );
}
