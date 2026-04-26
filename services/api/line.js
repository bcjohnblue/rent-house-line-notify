import axios from 'axios';

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * 建立單一租屋物件的 Flex Bubble（含封面圖片與詳細資訊）
 */
const createRentBubble = ({section_name, kind_name, price, unit, post_id, title, area_name, photo, floor_name, layoutStr, address, building_type}) => {
  const link = `https://rent.591.com.tw/${post_id}`;

  const infoItems = [
    { icon: '💰', text: `${price} ${unit}`, bold: true, color: '#E74C3C', size: 'lg' },
    { icon: '📍', text: address || section_name },
    { icon: '🏠', text: [layoutStr, area_name].filter(Boolean).join(' · ') },
    { icon: '🏢', text: [building_type, floor_name].filter(Boolean).join(' · ') },
  ].filter((item) => item.text);

  const bubble = {
    type: 'bubble',
    size: 'kilo',
    hero: {
      type: 'image',
      url: photo,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: link,
      },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: title || `${kind_name}出租`,
          weight: 'bold',
          size: 'md',
          wrap: true,
          maxLines: 2,
        },
        ...infoItems.map((item) => ({
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          ...(item === infoItems[0] ? { margin: 'md' } : {}),
          contents: [
            {
              type: 'text',
              text: item.icon,
              size: 'sm',
              flex: 0,
            },
            {
              type: 'text',
              text: item.text,
              weight: item.bold ? 'bold' : 'regular',
              size: item.size || 'sm',
              color: item.color || '#666666',
              flex: 1,
              wrap: true,
              maxLines: 1,
            },
          ],
        })),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'none',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '查看詳情',
            uri: link,
          },
          style: 'primary',
          color: '#1DB446',
        },
      ],
    },
  };

  // 如果沒有圖片就移除 hero
  if (!photo) {
    delete bubble.hero;
  }

  return bubble;
};

/**
 * 使用 Flex Message Carousel 批量推播租屋物件
 * 一個 Carousel 最多 12 個 Bubble，只算 1 則訊息
 * 超過 12 個會拆成多個 Carousel 分批發送
 */
export const sendFlexCarousel = async (dataList) => {
  if (!dataList.length) return;

  const MAX_BUBBLES = 12;
  const chunks = [];

  for (let i = 0; i < dataList.length; i += MAX_BUBBLES) {
    chunks.push(dataList.slice(i, i + MAX_BUBBLES));
  }

  for (const chunk of chunks) {
    const bubbles = chunk.map(createRentBubble);
    const message = {
      type: 'flex',
      altText: `🏠 ${chunk.length} 間新租屋上架`,
      contents: {
        type: 'carousel',
        contents: bubbles,
      },
    };

    await axios.post(
      LINE_PUSH_URL,
      {
        to: process.env.LINE_TARGET_ID,
        messages: [message],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
  }
};
