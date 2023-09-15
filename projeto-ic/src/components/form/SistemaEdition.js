import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';

const API_BASE_URL = "http://localhost:3333";

function SistemaEdition() {
  let { userId, codigoTurma } = useParams();
  const professorId = userId;

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    label: '',
    options: [],
    priority: 1,
    category: 'styles',
  });

  useEffect(() => {
    if (codigoTurma) {
      axios.get(`${API_BASE_URL}/questions/byclass/${codigoTurma}`)
        .then(response => {
          setQuestions(response.data);
        })
        .catch(error => {
          console.error('Erro ao buscar as perguntas:', error);
        });
    }
  }, [codigoTurma]);

  const handleDeleteQuestion = (questionId, indexToDelete) => {
    axios.delete(`${API_BASE_URL}/users/${professorId}/questions/${questionId}`)
      .then(response => {
        // Remova a questão da lista após a exclusão bem-sucedida
        setQuestions(prevQuestions =>
          prevQuestions.filter((_, index) => index !== indexToDelete)
        );
      })
      .catch(error => {
        console.error('Erro ao excluir a pergunta:', error);
      });
  };

  return (
    <div>
      {questions.map((question, index) => (
        <div key={question.label} className="questionContainer">
          <div className='deleteButtonContainer'>
            <button className='deleteButton' onClick={() => handleDeleteQuestion(question._id, index)}>
              <FaTrash />
            </button>
          </div>
          <div className="formGroup">
            <label>{question.label}</label>
            <select>
              <option value="">Selecione opção...</option>
              {question.options && question.options.map((option, optionIndex) => (
                <option key={optionIndex} value={optionIndex}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SistemaEdition;
