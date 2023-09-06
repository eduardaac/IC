import React from 'react';
import styles from '../index.module.css';
import Menu from '../../layout/cabecalho/Menu';
import Sistema from '../../form/Sistema';
import { useLocation } from 'react-router-dom'; // Importe o useLocation

function SistRecAluno() {
    const location = useLocation();
    const userId = location.state ? location.state.userId : null;
    const codigoTurma = location.state ? location.state.novoCodigoTurma : null;
    console.log("Codigo de turma na pagina renderizada: ", codigoTurma);
    return (
        <div className={styles.page}>
            <Menu userId={userId} />
            <div className={styles.container}>
                <div className={styles.form}>
                    <h1>SISTEMA DE RECOMENDAÇÃO</h1>
                    <Sistema codigoTurma={codigoTurma} />
                </div>
            </div>
        </div>
    );
}

export default SistRecAluno;
