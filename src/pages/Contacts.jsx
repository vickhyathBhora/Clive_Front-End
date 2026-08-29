import React, { useState } from 'react';
import { useChat } from './ChatContext';
import './Contacts.css';

const Contacts = () => {
  const {
    contacts = [],
    handleSelectContact,
    reqContacts = [],
  } = useChat();

  const [showRequests, setShowRequests] = useState(false);

  // Dynamically compute the active list
  const currentList = showRequests ? reqContacts : contacts;

  const handleToggleView = () => {
    setShowRequests((prev) => !prev);
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h3>{showRequests ? 'Contact Requests' : 'Contacts'}</h3>
        <button className="toggle-contacts-btn" onClick={handleToggleView}>
          <span>{showRequests ? 'Show Contacts' : 'Show Requests'}</span>
          <span className="toggle-count-badge">
            {showRequests ? contacts.length : reqContacts.length}
          </span>
        </button>
      </div>

      {currentList && currentList.length > 0 ? (
        <div className="contacts-list">
          {currentList.map((item, index) => {
            const contactObj = item.contact || {};
            const targetId = contactObj.id || item.contact_id || index;
            const name = contactObj.name || 'Unknown User';
            const email = contactObj.email || '';
            const unseend = Number(item.unseen);
            const avatar =
              contactObj.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

            return (
              <div
                key={targetId}
                className="contact-item"
                onClick={() => handleSelectContact(item)}
              >
                <div className="contact-card">
                  <img src={avatar} alt={name} className="contact-avatar" />
                  <div className="contact-info">
                    <h4 className="contact-name">{name}</h4>
                    {email && <p className="contact-email">{email}</p>}
                  </div>
                  {unseend > 0 && (
                    <div className="unseen-badge">
                      {unseend > 99 ? '99+' : unseend}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-contacts-msg">
          {showRequests
            ? 'No contact requests available.'
            : 'No contacts available.'}
        </p>
      )}
    </div>
  );
};

export default Contacts;