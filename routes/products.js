import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

// listar produtos
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*')

  if (error) return res.status(400).json(error)

  res.json(data)
})

// criar produto
router.post('/', async (req, res) => {
  const { name, price, image } = req.body

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, price, image }])

  if (error) return res.status(400).json(error)

  res.json(data)
})

export default router