const { response } = require('express');
const user = require('../models/userData');
const question = require('../models/questionData');
const { registerProfessorWithDefaultQuestions } = require('./QuestionController');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { callbackify } = require('util');

function generateUniqueCodigoTurma() {
    const codigoTurma = uuidv4();
    return codigoTurma;
}

const secretKey = 'sua_chave_secreta_aqui';

module.exports = {

    async login(request, response) {
        try {
            const { email, senha } = request.body;

            const existingUser = await user.findOne({ email });

            if (!existingUser) {
                return response.status(401).json({ error: 'E-mail inválido.' });
            }

            const isPasswordValid = await bcrypt.compare(senha, existingUser.senha);

            if (!isPasswordValid) {
                return response.status(401).json({ error: 'Senha inválida.' });
            }

            const token = jwt.sign({ userId: existingUser._id }, secretKey, { expiresIn: '1h' });

            return response.json({ token });

        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: 'Erro ao fazer login.' });
        }
    },

    async read(request, response) {
        try {
            const userList = await user.find();
            return response.json(userList);
        } catch (error) {
            return response.status(500).json({ error: 'Erro ao obter lista de usuários.' });
        }
    },

    async create(request, response) {
        try {
            const { nome, email, dataNascimento, senha, atuacao, escolaridade, typeUser, codigoTurma } = request.body;

            // Verificar se o typeUser é "professor" e gerar um código de turma aleatório e distinto
            let generatedCodigoTurma;
            if (typeUser === "professor") {
                generatedCodigoTurma = generateUniqueCodigoTurma();
            } else if (typeUser === "aluno") {
                // Verificar se o código de turma existe no banco de dados
                const turmaExists = await user.exists({ typeUser: "professor", codigoTurma });
                if (!turmaExists) {
                    return response.status(400).json({ error: 'Código de turma não encontrado.' });
                }
                generatedCodigoTurma = codigoTurma; // Salvar o código de turma fornecido pelo aluno
            }
            const userCreated = await user.create({
                nome,
                email,
                dataNascimento,
                senha,
                atuacao,
                escolaridade,
                typeUser,
                codigoTurma: generatedCodigoTurma,
            });

            // Verificar se o usuário criado é um professor e registrar as perguntas padrão, se necessário
            if (typeUser === 'professor') {
                const registerResult = await registerProfessorWithDefaultQuestions(userCreated._id);
                if (registerResult.error) {
                    return response.status(500).json({ error: 'Erro ao registrar professor com perguntas padrão.' });
                }
            }

            return response.status(201).json(userCreated);
        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: 'Erro ao criar usuário.' });
        }
    },

    async delete(request, response) {
        try {
            const { id } = request.params;

            // Encontre o professor para verificar seu tipo de usuário e codigoTurma
            const professor = await user.findById(id);

            if (!professor) {
                return response.status(404).json({ error: 'Usuário não encontrado.' });
            }

            // Verifique se o professor é do tipo de usuário 'professor' e tem um codigoTurma
            if (professor.typeUser === 'professor' && professor.codigoTurma) {
                // Encontre todos os alunos vinculados a esse professor pelo mesmo codigoTurma
                const alunos = await user.find({ typeUser: 'aluno', codigoTurma: professor.codigoTurma });

                // Atualize o código de turma dos alunos para null, para que eles precisem inserir novamente
                for (const aluno of alunos) {
                    aluno.codigoTurma = null;
                    await aluno.save();
                }
            }

            // Delete as perguntas do professor associadas ao codigoTurma
            await question.deleteMany({ professorId: id });

            const userDeleted = await user.findOneAndDelete({ _id: id });
            if (userDeleted) {
                return response.json(userDeleted);
            }
            return response.status(404).json({ error: 'Usuário não encontrado.' });
        } catch (error) {
            return response.status(500).json({ error: 'Erro ao remover usuário.' });
        }
    },

    async update(request, response) {
        try {
            const { id } = request.params;
            const {
                nome,
                email,
                dataNascimento,
                senha,
                atuacao,
                escolaridade,
                typeUser,
                codigoTurma
            } = request.body;

            console.log("Updating user with ID:", id);
            const existingUser = await user.findById(id);

            if (!existingUser) {
                return response.status(404).json({ error: 'Usuário não encontrado.' });
            }

            // Atualizar somente os campos que foram enviados no corpo da requisição
            existingUser.nome = nome || existingUser.nome;
            existingUser.email = email || existingUser.email;
            existingUser.dataNascimento = dataNascimento || existingUser.dataNascimento;
            existingUser.atuacao = atuacao || existingUser.atuacao;
            existingUser.escolaridade = escolaridade || existingUser.escolaridade;
            existingUser.typeUser = typeUser || existingUser.typeUser;

            // Se uma nova senha foi fornecida, criptografá-la e atualizar
            if (senha) {
                existingUser.senha = await bcrypt.hash(senha, 10);
            }

            if (typeUser === 'professor') {
                existingUser.codigoTurma = generateUniqueCodigoTurma();
                const updatedUser = await existingUser.save();

                const registerResult = await registerProfessorWithDefaultQuestions(updatedUser._id);
                if (registerResult.error) {
                    return response.status(500).json({ error: 'Erro ao registrar professor com perguntas padrão.' });
                }
            } else if (typeUser === 'aluno') {
                const turmaExists = await user.exists({ typeUser: "professor", codigoTurma });
                if (!turmaExists) {
                    return response.status(400).json({ error: 'Código de turma não encontrado.' });
                }
                existingUser.codigoTurma = codigoTurma || existingUser.codigoTurma;
            }

            // Salvar as alterações
            const updatedUser = await existingUser.save();

            return response.json(updatedUser);
        } catch (error) {
            return response.status(500).json({ error: 'Erro ao atualizar o usuário.' });
        }
    }
};
