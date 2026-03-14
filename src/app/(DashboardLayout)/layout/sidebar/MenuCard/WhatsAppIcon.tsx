
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = ({ phoneNumber = '+94750688759' }) => {
  const handleClick = () => {
    const message = "Hi, I need more information!";
    const url = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      style={{
        // position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      }}
    >
      <FaWhatsapp size={32} />
    </div>
  );
};

export default WhatsAppButton;