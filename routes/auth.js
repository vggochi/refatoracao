import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    message: 'Auth API funcionando',
    routes: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  })
})

// cadastro
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) return res.status(400).json(error)

  const user = data.user

  // 👇 SALVA NO PROFILES
  if (user) {
    await supabase.from('profiles').insert([
      {
        id: user.id,
        email,
        name
      }
    ])
  }

  res.json(data)
})

// login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) return res.status(400).json(error)

  res.json(data)
})

export default router