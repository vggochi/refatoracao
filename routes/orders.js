import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')

  if (error) return res.status(400).json(error)

  res.json(data)
})

// criar pedido
router.post('/', async (req, res) => {
  const { user_id, items, total } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Pedido deve conter pelo menos um item' })
  }

  // cria pedido
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{ user_id, total }])
    .select()
    .single()

  if (error) return res.status(400).json(error)

  // cria itens do pedido
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    price: item.price
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) return res.status(400).json(itemsError)

  res.json(order)
})

export default router