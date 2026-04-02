export const ok      = (res, data, status = 200) => res.status(status).json(data)
export const created = (res, data) => res.status(201).json(data)
export const noContent = res => res.status(204).send()
export const paginate = (data, total, page, limit) => ({
  data, total, page: +page,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1
})
