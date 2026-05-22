/** 商城类型：与 API products.type / orders.orderType 一致 */
export const MallType = {
  CONSUME: 1,
  EXCHANGE: 2,
  REDEEM: 3,
} as const

export const MallTypeName: Record<number, string> = {
  1: '消费商城',
  2: '换购商城',
  3: '兑换商城',
}

/** 订单状态 */
export const OrderStatus = {
  CANCELLED: 0,
  PENDING_PAY: 1,
  PAID: 2,
  SHIPPED: 3,
  COMPLETED: 4,
  REFUNDING: 5,
  REFUNDED: 6,
  REFUND_REJECTED: 7,
} as const

export const OrderStatusName: Record<number, string> = {
  0: '已取消',
  1: '待付款',
  2: '已付款',
  3: '已发货',
  4: '已完成',
  5: '退款中',
  6: '已退款',
  7: '退款拒绝',
}
