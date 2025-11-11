import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useClickOutside, useEscapeKey } from '../hooks';
import { useUITranslation } from '../../../hooks/useTranslation';
import './ContextMenu.css';

const ContextMenu = ({ 
  items = [], 
  children, 
  locale, 
  translations 
}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const menuRef = useRef(null);
    const { t } = useUITranslation('ui.contextMenu', { locale, translations });

    const closeMenu = useCallback(() => {
        setVisible(false);
    }, []);

    useClickOutside(menuRef, closeMenu);
    useEscapeKey(closeMenu);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setCoords({ x: e.clientX, y: e.clientY });
        setVisible(true);
    }, []);

    const handleItemClick = useCallback((item) => {
        if (item.disabled) return;
        closeMenu();
        if (item.onClick) item.onClick();
    }, [closeMenu]);

    return (
        <div className="context-menu-container" onContextMenu={handleContextMenu}>
            {children}
            {visible && (
                <ul
                    ref={menuRef}
                    className="context-menu"
                    style={{
                        top: coords.y,
                        left: coords.x,
                    }}
                    role="menu"
                    aria-hidden={!visible}
                >
                    {items.map((item, idx) => (
                        <li
                            key={item.id || idx}
                            className={`context-menu__item ${item.disabled ? 'context-menu__item--disabled' : ''}`}
                            onClick={() => handleItemClick(item)}
                            role="menuitem"
                            tabIndex={item.disabled ? -1 : 0}
                        >
                            {item.icon && <span className="context-menu__icon">{item.icon}</span>}
                            <span className="context-menu__label">{item.label}</span>
                            {item.shortcut && <span className="context-menu__shortcut">{item.shortcut}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

ContextMenu.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.string.isRequired,
            icon: PropTypes.node,
            shortcut: PropTypes.string,
            disabled: PropTypes.bool,
            onClick: PropTypes.func,
        })
    ),
    children: PropTypes.node.isRequired,
    locale: PropTypes.string,
    translations: PropTypes.object,
};

export default ContextMenu;