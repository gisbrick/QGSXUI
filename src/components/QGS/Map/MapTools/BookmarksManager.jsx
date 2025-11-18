import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { useLocalStorage } from '../../../UI/hooks';
import Modal from '../../../UI/Modal/Modal';
import { Button } from '../../../UI';
import './BookmarksManager.css';

const STORAGE_KEY = 'qgs_map_bookmarks';

/**
 * Estructura de un bookmark:
 * {
 *   id: string (timestamp),
 *   name: string,
 *   center: [lat, lng],
 *   zoom: number,
 *   screenshot: string (base64 data URL),
 *   createdAt: number (timestamp)
 * }
 */

/**
 * Componente para gestionar bookmarks de extensiones del mapa
 * Permite guardar, editar, borrar y aplicar bookmarks
 */
const BookmarksManager = ({ isOpen, onClose }) => {
  const mapContext = useMap();
  const { mapInstance } = mapContext || {};
  const qgisContext = useContext(QgisConfigContext);
  const { t: contextT, language } = qgisContext || {};
  
  const [bookmarks, setBookmarks] = useLocalStorage(STORAGE_KEY, []);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  const tr = (key, es, en) => {
    const t = contextT || ((k) => k);
    const v = typeof t === 'function' ? t(key) : key;
    if (v && v !== key) return v;
    const lang = (language || 'es').toLowerCase();
    return lang.startsWith('en') ? (en || es || key) : (es || en || key);
  };

  // Capturar pantallazo del mapa
  const captureMapScreenshot = async () => {
    if (!mapInstance) return null;
    
    try {
      setIsCapturing(true);
      const mapContainer = mapInstance.getContainer();
      if (!mapContainer) return null;

      // Capturar solo el área del mapa (sin controles)
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        logging: false,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        scale: 0.5, // Reducir tamaño para ahorrar espacio
        backgroundColor: null
      });

      return canvas.toDataURL('image/jpeg', 0.7); // JPEG con 70% de calidad
    } catch (error) {
      console.error('[BookmarksManager] Error capturando pantallazo:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // Guardar nuevo bookmark
  const handleSaveBookmark = async () => {
    if (!mapInstance || !newBookmarkName.trim()) return;

    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();
    const screenshot = await captureMapScreenshot();

    const newBookmark = {
      id: Date.now().toString(),
      name: newBookmarkName.trim(),
      center: [center.lat, center.lng],
      zoom: zoom,
      screenshot: screenshot || '',
      createdAt: Date.now()
    };

    setBookmarks([...bookmarks, newBookmark]);
    setNewBookmarkName('');
    setShowAddDialog(false);
    
    const message = tr('ui.map.bookmarks.saved', 'Marcador guardado', 'Bookmark saved');
    qgisContext?.notificationManager?.addNotification?.({
      title: tr('ui.common.success', 'Éxito', 'Success'),
      text: message,
      type: 'success'
    });
  };

  // Aplicar bookmark (navegar a la extensión)
  const handleApplyBookmark = (bookmark) => {
    if (!mapInstance) return;
    
    mapInstance.setView(
      { lat: bookmark.center[0], lng: bookmark.center[1] },
      bookmark.zoom,
      { animate: true }
    );
    
    onClose();
  };

  // Iniciar edición de nombre
  const handleStartEdit = (bookmark) => {
    setEditingId(bookmark.id);
    setEditingName(bookmark.name);
    setTimeout(() => {
      if (editInputRef.current) editInputRef.current.focus();
    }, 0);
  };

  // Guardar edición de nombre
  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      setEditingName('');
      return;
    }

    setBookmarks(bookmarks.map(b => 
      b.id === editingId 
        ? { ...b, name: editingName.trim() }
        : b
    ));
    setEditingId(null);
    setEditingName('');
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Borrar bookmark
  const handleDeleteBookmark = (bookmarkId) => {
    if (window.confirm(tr('ui.map.bookmarks.deleteConfirm', '¿Eliminar este marcador?', 'Delete this bookmark?'))) {
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    }
  };

  // Focus en input cuando se abre el diálogo de añadir
  useEffect(() => {
    if (showAddDialog && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showAddDialog]);

  // Manejar Enter/Escape en inputs
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showAddDialog) {
        setShowAddDialog(false);
        setNewBookmarkName('');
      } else if (editingId) {
        handleCancelEdit();
      }
    }
  };

  if (!isOpen) return null;

  const dialogTitle = tr('ui.map.bookmarks.title', 'Marcadores de extensión', 'Map bookmarks');

  const content = (
    <div className="bookmarks-manager">
      <div className="bookmarks-actions">
        <Button
          size="small"
          icon={<i className="fas fa-bookmark" />}
          onClick={() => setShowAddDialog(true)}
          disabled={!mapInstance || isCapturing}
        >
          {tr('ui.map.bookmarks.add', 'Añadir marcador', 'Add bookmark')}
        </Button>
      </div>

      {showAddDialog && (
        <div className="bookmarks-add-dialog">
          <div className="bookmarks-add-input">
            <input
              ref={inputRef}
              type="text"
              value={newBookmarkName}
              onChange={(e) => setNewBookmarkName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleSaveBookmark)}
              placeholder={tr('ui.map.bookmarks.namePlaceholder', 'Nombre del marcador', 'Bookmark name')}
              disabled={isCapturing}
            />
            <div className="bookmarks-add-buttons">
              <Button
                size="small"
                onClick={handleSaveBookmark}
                disabled={!newBookmarkName.trim() || isCapturing}
              >
                {isCapturing 
                  ? tr('ui.map.bookmarks.capturing', 'Capturando...', 'Capturing...')
                  : tr('ui.common.save', 'Guardar', 'Save')
                }
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewBookmarkName('');
                }}
                disabled={isCapturing}
              >
                {tr('ui.common.cancel', 'Cancelar', 'Cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bookmarks-list">
        {bookmarks.length === 0 ? (
          <div className="bookmarks-empty">
            {tr('ui.map.bookmarks.empty', 'No hay marcadores guardados', 'No bookmarks saved')}
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-item">
              <div 
                className="bookmark-preview"
                onClick={() => handleApplyBookmark(bookmark)}
                title={tr('ui.map.bookmarks.clickToGo', 'Clic para ir a esta extensión', 'Click to go to this extent')}
              >
                {bookmark.screenshot ? (
                  <img src={bookmark.screenshot} alt={bookmark.name} />
                ) : (
                  <div className="bookmark-no-image">
                    <i className="fas fa-map" />
                  </div>
                )}
              </div>
              <div className="bookmark-info">
                {editingId === bookmark.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                    onBlur={handleSaveEdit}
                    className="bookmark-edit-input"
                    autoFocus
                  />
                ) : (
                  <div className="bookmark-name" onClick={() => handleStartEdit(bookmark)}>
                    {bookmark.name}
                  </div>
                )}
                <div className="bookmark-actions">
                  {editingId === bookmark.id ? (
                    <>
                      <Button
                        size="small"
                        circular
                        icon={<i className="fas fa-check" />}
                        onClick={handleSaveEdit}
                        title={tr('ui.common.save', 'Guardar', 'Save')}
                      />
                      <Button
                        size="small"
                        circular
                        icon={<i className="fas fa-times" />}
                        onClick={handleCancelEdit}
                        title={tr('ui.common.cancel', 'Cancelar', 'Cancel')}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        circular
                        icon={<i className="fas fa-edit" />}
                        onClick={() => handleStartEdit(bookmark)}
                        title={tr('ui.common.edit', 'Editar', 'Edit')}
                      />
                      <Button
                        size="small"
                        circular
                        icon={<i className="fas fa-trash" />}
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        title={tr('ui.common.delete', 'Eliminar', 'Delete')}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return createPortal(
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={dialogTitle}
      size="medium"
      lang={language || 'es'}
    >
      {content}
    </Modal>,
    document.body
  );
};

export default BookmarksManager;

