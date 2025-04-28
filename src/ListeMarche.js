import React, { useState, useEffect } from 'react';
import './ListeMarche.css';

const ListeMarche = () => {
  const [lists, setLists] = useState([]);
  const [currentList, setCurrentList] = useState({
    id: Date.now(),
    name: 'Nouvelle liste',
    items: [],
    budgetMax: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [newItem, setNewItem] = useState({
    text: '',
    price: 0
  });
  const [filter, setFilter] = useState('tous');
  const [newListName, setNewListName] = useState('');
  const [budgetError, setBudgetError] = useState(false);
  const [editingListName, setEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  
  // Charger les données depuis le localStorage au montage
  useEffect(() => {
    const savedLists = localStorage.getItem('marketLists');
    if (savedLists) {
      const parsedLists = JSON.parse(savedLists);
      // Migration pour les anciennes listes sans dates
      const migratedLists = parsedLists.map(list => ({
        ...list,
        createdAt: list.createdAt || new Date().toISOString(),
        updatedAt: list.updatedAt || new Date().toISOString()
      }));
      setLists(migratedLists);
      
      // Charger la dernière liste modifiée si elle existe
      if (migratedLists.length > 0) {
        const mostRecent = [...migratedLists].sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        setCurrentList(mostRecent);
      }
    }
  }, []);

  // Sauvegarder les données dans le localStorage quand elles changent
  useEffect(() => {
    localStorage.setItem('marketLists', JSON.stringify(lists));
  }, [lists]);

  // Vérifier le budget à chaque modification
  useEffect(() => {
    const total = currentList.items
      .filter(item => item.acheté)
      .reduce((sum, item) => sum + item.price, 0);
    
    setBudgetError(total > currentList.budgetMax && currentList.budgetMax > 0);
  }, [currentList.items, currentList.budgetMax]);

  const addItem = () => {
    if (newItem.text.trim() === '' || newItem.price < 0) return;
    
    const price = parseFloat(newItem.price);
    if (isNaN(price)) return;

    setCurrentList({
      ...currentList,
      items: [...currentList.items, { 
        id: Date.now(), 
        text: newItem.text, 
        price: price,
        acheté: false 
      }],
      updatedAt: new Date().toISOString()
    });
    setNewItem({ text: '', price: 0 });
  };

  const toggleAchete = (id) => {
    setCurrentList({
      ...currentList,
      items: currentList.items.map(item => 
        item.id === id ? { ...item, acheté: !item.acheté } : item
      ),
      updatedAt: new Date().toISOString()
    });
  };

  const deleteItem = (id) => {
    setCurrentList({
      ...currentList,
      items: currentList.items.filter(item => item.id !== id),
      updatedAt: new Date().toISOString()
    });
  };

  const updateBudget = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setCurrentList({
      ...currentList,
      budgetMax: value,
      updatedAt: new Date().toISOString()
    });
  };

  const saveCurrentList = () => {
    const updatedList = {
      ...currentList,
      updatedAt: new Date().toISOString()
    };

    const updatedLists = lists.some(list => list.id === currentList.id)
      ? lists.map(list => list.id === currentList.id ? updatedList : list)
      : [...lists, updatedList];
    
    setLists(updatedLists);
    setCurrentList(updatedList);
  };

  const createNewListFromCurrent = () => {
    if (!newListName.trim()) return;
    
    const newList = {
      id: Date.now(),
      name: newListName + ' copie',
      items: currentList.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        acheté: false
      })),
      budgetMax: currentList.budgetMax,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLists([...lists, newList]);
    setCurrentList(newList);
    setNewListName('');
  };

  const selectList = (id) => {
    const selected = lists.find(list => list.id === id);
    if (selected) setCurrentList(selected);
  };

  const deleteList = (id, e) => {
    e.stopPropagation();
    const updatedLists = lists.filter(list => list.id !== id);
    setLists(updatedLists);
    
    if (currentList.id === id) {
      setCurrentList({
        id: Date.now(),
        name: new Date().toISOString(),
        items: [],
        budgetMax: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const startEditingListName = () => {
    setTempListName(currentList.name);
    setEditingListName(true);
  };

  const saveListName = () => {
    if (tempListName.trim()) {
      setCurrentList({
        ...currentList,
        name: tempListName,
        updatedAt: new Date().toISOString()
      });
    }
    setEditingListName(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredItems = currentList.items.filter(item => {
    if (filter === 'achetés') return item.acheté;
    if (filter === 'non Achetés') return !item.acheté;
    return true;
  });

  const totalDepense = currentList.items
    .filter(item => item.acheté)
    .reduce((sum, item) => sum + item.price, 0);

  const resteBudget = currentList.budgetMax - totalDepense;

  return (
    <div className="liste-marche-container">
      <h1>Gestion des Listes de Marché</h1>
      
      <div className={`budget-section ${budgetError ? 'budget-error' : ''}`}>
        <label>
          Budget Max:
          <input
            type="number"
            value={currentList.budgetMax}
            onChange={updateBudget}
            min="0"
            step="0.01"
          />
        </label>
        <div className="budget-info">
          <span>Total dépensé: {totalDepense.toFixed(2)}Fcfa</span>
          <span>Reste: {resteBudget.toFixed(2)}Fcfa</span>
          {budgetError && (
            <div className="error-message">
              Attention! Vous avez dépassé votre budget!
            </div>
          )}
        </div>
      </div>
      
      <div className="lists-management">
        <div className="saved-lists">
          <h3>Listes sauvegardées</h3>
          <ul>
            {lists.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(list => (
              <li 
                key={list.id} 
                className={list.id === currentList.id ? 'active' : ''}
                onClick={() => selectList(list.id)}
              >
                <div className="list-header">
                  <strong>{list.name}</strong>
                  <button 
                    className="delete-list-btn"
                    onClick={(e) => deleteList(list.id, e)}
                  >
                    ×
                  </button>
                </div>
                <div className="list-meta">
                  <span>{list.items.length} Articles</span>
                  <span>{formatDate(list.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={saveCurrentList}>
            {lists.some(list => list.id === currentList.id) ? 'Mettre à jour' : 'Sauvegarder'}
          </button>
        </div>
        
        <div className="current-list">
          {editingListName ? (
            <div className="list-name-edit">
              <input
                type="text"
                value={tempListName}
                onChange={(e) => setTempListName(e.target.value)}
                onBlur={saveListName}
                onKeyPress={(e) => e.key === 'Enter' && saveListName()}
                autoFocus
              />
              <button onClick={saveListName}>✓</button>
            </div>
          ) : (
            <h2 onClick={startEditingListName}>
              {currentList.name}
              <span className="edit-icon">✏️</span>
            </h2>
          )}
          <div className="list-dates">
            <span>Créée le: {formatDate(currentList.createdAt)}</span>
            <span>Modifiée le: {formatDate(currentList.updatedAt)}</span>
          </div>
          
          <div className="add-item">
            <input
              type="text"
              value={newItem.text}
              onChange={(e) => setNewItem({...newItem, text: e.target.value})}
              placeholder="Nom de l'article"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <input
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              placeholder="Prix"
              min="0"
              step="0.01"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <button onClick={addItem}>Ajouter</button>
          </div>
          
          <div className="filters">
            <button 
              className={filter === 'tous' ? 'active' : ''}
              onClick={() => setFilter('tous')}
            >
              Tous
            </button>
            <button 
              className={filter === 'achetés' ? 'active' : ''}
              onClick={() => setFilter('achetés')}
            >
              Achetés
            </button>
            <button 
              className={filter === 'nonAchetés' ? 'active' : ''}
              onClick={() => setFilter('nonAchetés')}
            >
              Non achetés
            </button>
          </div>
          
          <ul className="items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <li key={item.id} className={item.acheté ? 'achete' : ''}>
                  <span onClick={() => toggleAchete(item.id)}>
                    {item.text} - {item.price.toFixed(2)}€
                  </span>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteItem(item.id)}
                  >
                    Supprimer
                  </button>
                </li>
              ))
            ) : (
              <p>Aucun article dans la liste</p>
            )}
          </ul>
          
          <div className="new-list-from-current">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la nouvelle liste"
            />
            <button onClick={createNewListFromCurrent}>
              Créer une nouvelle liste à partir de celle-ci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeMarche;