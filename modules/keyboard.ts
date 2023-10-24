const minuteToMsString = (minute: number) => String(minute * 60 * 1000)

export const intervalInlineKeyboard = [
  [
    { text: '10 min', callback_data: minuteToMsString(10) },
    { text: '30 min', callback_data: minuteToMsString(30) },
    { text: '1 hr', callback_data: minuteToMsString(60) },
  ],
  [
    { text: '3 hr', callback_data: minuteToMsString(2 * 60) },
    { text: '6 hr', callback_data: minuteToMsString(6 * 60) },
    { text: '12 hr', callback_data: minuteToMsString(12 * 60) },
  ],
  [
    { text: '1 d', callback_data: minuteToMsString(24 * 60) },
  ],
]

export const targetSelectorInlineKeyboard = [
  [
    { text: '*', callback_data: '*' },
    { text: 'div', callback_data: 'div' },
    { text: 'a', callback_data: 'a' },
  ],
  [
    { text: '💾 Save', callback_data: '/save' },
  ],
]
