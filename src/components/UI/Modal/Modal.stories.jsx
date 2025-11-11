import React, { useState } from 'react';
import Modal from './Modal';

export default {
  title: '04 - UI/Modal',
  component: Modal
};

export const Default = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          title="Modal Simple"
        >
          <p>Contenido del modal</p>
        </Modal>
      </>
    );
  }
};