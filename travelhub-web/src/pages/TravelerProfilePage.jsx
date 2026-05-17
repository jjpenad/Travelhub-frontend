import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import { getUserProfile, deactivateUserAccount } from '../services/api';
import { clearSessionUser, SESSION_CHANGED_EVENT } from '../auth/sessionAuth';
import { PATH_TRAVELERS_HOME } from '../constants/routes';
import './TravelerProfilePage.css';

function TravelerProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message || t('userProfile.errorTitle'));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [t]);

  const handleDeleteAccount = async () => {
    if (!acceptedConditions) return;
    try {
      setIsDeleting(true);
      await deactivateUserAccount();
      
      // Limpiar sesión y notificar cambios
      clearSessionUser();
      window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
      
      // Redirigir a inicio
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    } catch (err) {
      console.error('Error al dar de baja:', err);
      alert(t('userProfile.errorTitle') || 'No se pudo dar de baja la cuenta.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  let content;

  if (loading) {
    content = (
      <div className="traveler-profile-page">
        <div className="profile-loading">
          <span className="profile-spinner"></span>
          <p>{t('userProfile.loading')}</p>
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="traveler-profile-page">
        <div className="profile-error">
          <p>{t('userProfile.errorTitle')}</p>
          <p className="profile-error-message">{error}</p>
        </div>
      </div>
    );
  } else if (profile) {
    content = (
      <div className="traveler-profile-page">
        <header className="profile-header">
          <div className="profile-avatar">
            {profile.first_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1>{profile.first_name} {profile.last_name}</h1>
            <p className="profile-role">
              {profile.user_type === 'traveler' ? t('userProfile.roleTraveler') : profile.user_type}
            </p>
          </div>
        </header>

        <section className="profile-details-grid">
          <div className="profile-card">
            <h2>{t('userProfile.personalDataTitle')}</h2>
            <div className="profile-info-row">
              <span className="profile-info-label">{t('userProfile.labelEmail')}:</span>
              <span className="profile-info-value">{profile.email} {profile.email_verified && '✅'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">{t('userProfile.labelPhone')}:</span>
              <span className="profile-info-value">{profile.phone || t('userProfile.notSpecified')}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">{t('userProfile.labelCountry')}:</span>
              <span className="profile-info-value">{profile.country_id || t('userProfile.notSpecified')}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">{t('userProfile.labelStatus')}:</span>
              <span className="profile-info-value">
                {profile.active ? (
                  <span className="status-active">{t('userProfile.statusActive')}</span>
                ) : (
                  <span className="status-inactive">{t('userProfile.statusInactive')}</span>
                )}
              </span>
            </div>
          </div>

          <div className="profile-card">
            <h2>{t('userProfile.tripsSummaryTitle')}</h2>
            <div className="profile-stats">
              <div className="stat-box">
                <span className="stat-number">{profile.past_reservations_count}</span>
                <span className="stat-label">{t('userProfile.completedTrips')}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{profile.pending_reservations_count}</span>
                <span className="stat-label">{t('userProfile.pendingTrips')}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="profile-actions-bottom">
          <button 
            className="profile-btn-danger" 
            onClick={() => {
              setAcceptedConditions(false);
              setShowDeleteModal(true);
            }}
          >
            {t('userProfile.deleteAccountBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="traveler-profile-page-wrapper">
      <Navbar />
      <PageContainer>
        {content}
      </PageContainer>

      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h2>{t('userProfile.deleteModalTitle')}</h2>
            <p className="delete-modal-warning">
              {t('userProfile.deleteModalWarning')}
            </p>
            
            <label className="delete-modal-checkbox-label">
              <input 
                type="checkbox" 
                checked={acceptedConditions}
                onChange={(e) => setAcceptedConditions(e.target.checked)}
              />
              <span>{t('userProfile.deleteModalCheckbox')}</span>
            </label>

            <div className="delete-modal-actions">
              <button 
                className="delete-modal-btn delete-modal-btn-cancel" 
                onClick={() => setShowDeleteModal(false)}
              >
                {t('userProfile.deleteModalCancel')}
              </button>
              <button 
                className="delete-modal-btn delete-modal-btn-accept" 
                onClick={handleDeleteAccount}
                disabled={!acceptedConditions || isDeleting}
              >
                {isDeleting ? '...' : t('userProfile.deleteModalAccept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelerProfilePage;
