import React, { useState, useEffect } from 'react';
import { db } from './services/firebase'; // Verifique se é ./ ou ../
import { collection, onSnapshot, query, addDoc, orderBy } from 'firebase/firestore';
import { Project } from './types'; // Importe seu tipo para o TS não reclamar

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Busca os projetos ordenados pela data de início
    const q = query(collection(db, 'projects'), orderBy('startDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    });

    return () => unsubscribe(); // Limpa a conexão ao fechar o app
  }, []);

  const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
    try {
      await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date().toISOString()
      });
      alert("Obra guardada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar no Firestore:", e);
      alert("Erro ao salvar. Verifique o console.");
    }
  };

  // ... restante do renderContent e return ...
  return (
    // Seu JSX aqui
  );
};

export default App;