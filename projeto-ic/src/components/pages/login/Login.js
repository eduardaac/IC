import React from 'react';
import styles from '../index.module.css';
import LoginP from '../../form/LoginP';
import Footer from '../../layout/footer/Footer';
import logo from '../../img/logo.png'

function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.loginAside}>
        <img src={logo} alt=' ' style={{ height: "55%", width: '90%' }}></img>
        <h1>Um sistema de recomendações de <span className={styles.cor}>dec
        </span>isões de pr<span className={styles.cor}>o</span>jeto arquitetu<span className={styles.cor}>ra</span>l</h1>
      </div>
      <div className={styles.containerForm}>
        <h1>LOGIN</h1>
        <LoginP />
        <Footer
          frase="Não possui cadastro? Cadastra-se"
          rota="/Cadastro1"
        />
      </div>
    </div>
  )
}
export default Login;