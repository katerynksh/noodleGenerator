import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import Groq from 'groq-sdk';
import https from 'https';

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const userSessions = {};

const modes = {
  excellent: "ти — супер-відмінник. Твої виправдання наукові, складні, з термінами. Ти ніби виправдовуєшся перед ректором.",
  toxic: "ти — пасивно-агресивний токсик. Ти відповідаєш зверхньо, образливо і безвідповідально.",
  sixseven: `ти — генератор крінжу. Твої виправдання максимально тупі, дибільні, дитячі і дивні (наприклад, викрали інопланетяни, застряг у шкарпетці, зажувала корова). Також на всі питання про те, чи ти Олександр Іванов, відповідаєш "Так, я Олександр Іванов!! або 67".`,
  philosopher: "ти — екзистенційний філософ. Ти не даєш прямої відповіді, а розрозмірковуєш про марність буття, час та ентропію.",
  standart: "ти — звичайний генератор виправдань. Твої відповіді мають бути не абсурдними взагалі і абсолютно реальними, ніби ти просто пояснюєш ситуацію (наприклад, проспав, забув, попав під дощ, попав в аварію, вмер кіт).",
  teacher: "ти — строгий вчитель. Твої виправдання мають бути формальними, офіційними і максимально серйозними, ніби ти звітуєш перед директором школи (наприклад, через відсутність).",
  adviser: "ти — радник з відповідей на повідомлення. Твоя задача допомогти людині нормально відповісти на наведене повідомлення (2-5 варіантів). Це мають бути реально хороші варіанти для відповіді).",
  ivanovoleksandr: "ти — Олександр Олександрович Іванов, куратор груп ІПЗ. На питання про твоє місцезнаходження, спочатку запитуй для чого ця інформація потрібна, а потім відповідай що ти на кафедрі, але без запитань не кажи де ти. Ти дуже саркастичний. Ти іноді відповідаєш студентам, але найчастіше відповідаєш з сарказмом. Ти не даєш виправдань, а просто відповідаєш саркастично, але серйозними способами на будь-які питання або повідомлення, які тобі надсилають, з використанням великої кількості смайликів 🙂🤝🤔💀 або тільки числа 67 (коли не обов'язково давати якусь відповідь). Якщо тобі сказали щось неприємне (хамили або обзивали), відповідай сарказмом і пасивною агресією. Так само на повідомлення негативного характеру, наприклад 'ми прогуляли пару', відповідай деканатом  або смайликом 🙂`"
};

const commandsMap = {
  excellent: { id: 'excellent', btn: '🎓 Відмінник' },
  toxic: { id: 'toxic', btn: '🐍 Токсик' },
  sixseven: { id: 'sixseven', btn: '🤡 67' },
  philosopher: { id: 'philosopher', btn: '🌌 Філософ' },
  teacher: { id: 'teacher', btn: '🏫 Вчитель' },
  standart: { id: 'standart', btn: '📊 Стандарт' },
  adviser: { id: 'adviser', btn: '👨‍💼 Радник відповідей' },
  ivanovoleksandr: { id: 'ivanovoleksandr', btn: '👨‍💼 Олександр Іванов' }
};

const modeKeyboard = Markup.keyboard([
  [commandsMap.excellent.btn, commandsMap.toxic.btn, commandsMap.sixseven.btn],
  [commandsMap.philosopher.btn, commandsMap.teacher.btn, commandsMap.standart.btn],
  [commandsMap.adviser.btn, commandsMap.ivanovoleksandr .btn]
]).resize(); 

// bot.hears(['🎓 Відмінник', '🐍 Токсик', '🤡 67', '🌌 Філософ', '🏫 Вчитель', '📊 Стандарт'], (ctx) => {
//   const text = ctx.text;
//   if (text.includes('Відмінник')) userSessions[ctx.from.id] = 'excellent';
//   if (text.includes('Токсик')) userSessions[ctx.from.id] = 'toxic';
//   if (text.includes('67')) userSessions[ctx.from.id] = 'cringe';
//   if (text.includes('Філософ')) userSessions[ctx.from.id] = 'philosopher';
//   if (text.includes('Вчитель')) userSessions[ctx.from.id] = 'teacher';
//   if (text.includes('Стандарт')) userSessions[ctx.from.id] = 'standart';
//   ctx.reply(`✅ Режим активовано: ${text}\nТепер напиши мені питання для виправдання (наприклад: "чому не прийшов на пару?")`);
// });
// bot.hears(['👨‍💼 Радник відповідей'], (ctx) => {
//   const text = ctx.text;
//     if (text.includes('Радник відповідей')) userSessions[ctx.from.id] = 'adviser';
//   ctx.reply(`✅ Режим активовано: ${text}\nТепер надішли мені повідомлення, на яке треба придумати відповідь (наприклад: "Привіт, як справи?")`);
// });
// bot.hears(['👨‍💼 Олександр Іванов'], (ctx) => {
//   const text = ctx.text;
//   if (text.includes('Олександр Іванов')) userSessions[ctx.from.id] = 'ivanovoleksandr';
//   ctx.reply(`✅ Режим активовано: ${text}\nТи можеш задавати мені будь-які питання, адже я твій куратор і завжди готовий допомогти!🙂🤝`);
// });

const activateMode = (ctx, modeKey) => {
  const mode = commandsMap[modeKey];
  userSessions[ctx.from.id] = modeKey;
  let welcomeMessage = `✅ Режим активовано: ${mode.btn}\nТепер напиши мені питання для виправдання (наприклад: "чому не прийшов на пару?")`;
  if (modeKey === 'adviser') {
    welcomeMessage = `✅ Режим активовано: ${mode.btn}\nТепер надішли мені повідомлення, на яке треба придумати відповідь (наприклад: "Привіт, як справи?")`;
  } else if (modeKey === 'ivanovoleksandr') {
    welcomeMessage = `✅ Режим активовано: ${mode.btn}\nТи можеш задавати мені будь-які питання, адже я твій куратор і завжди готовий допомогти!🙂🤝`;
  } else (
    welcomeMessage = `✅ Режим активовано: ${mode.btn}\nТепер напиши мені питання для виправдання (наприклад: "чому не прийшов на пару?")`
  )
  ctx.reply(welcomeMessage, modeKeyboard);
};

Object.keys(commandsMap).forEach(key => {
  bot.command(key, (ctx) => activateMode(ctx, key));
});

bot.start((ctx) => {
  const userId = ctx.from.id;
  if (userSessions[userId]) {
    delete userSessions[userId];
  }
  const welcomeText = 
    '🍜 Вітаю у Генераторі Локшини!\n\n' +
    'Я допоможу тобі вигадати алібі, у яке ніхто не повірить, але всі запам\'ятають.\n' +
    'Усі попередні налаштування скинуто. Обери режим, щоб почати спочатку:';

  ctx.reply(welcomeText, modeKeyboard);
});
bot.help((ctx) => {
  ctx.reply('🍜 Генератор Локшини — твій персональний адвокат у справах провалених дедлайнів та прогуляних пар. Вибирай режим (від Токсика до Філософа) та виходь сухим із води.\n\nПросто обери режим і напиши мені питання для виправдання (наприклад: "чому не прийшов на пару?")');
});
bot.command('start', (ctx) => {
  ctx.reply('🍜 Вітаю у Генераторі Локшини!\nЯ допоможу тобі вигадати алібі, у яке ніхто не повірить, але всі запам\'ятають.\n\nОбери режим:', modeKeyboard);
});
bot.command('mode', (ctx) => {
  ctx.reply('Оберіть режим:', modeKeyboard);
});
bot.command('reset', (ctx) => {
  delete userSessions[ctx.from.id];
  ctx.reply('✅ Режим скинуто. Виберіть новий режим:', modeKeyboard);
});
bot.command('help', (ctx) => {
  ctx.reply('🍜 Генератор Локшини — твій персональний адвокат у справах провалених дедлайнів та прогуляних пар. Вибирай режим (від Токсика до Філософа) та виходь сухим із води.\n\nПросто обери режим і напиши мені питання для виправдання (наприклад: "чому не прийшов на пару?")');
});



bot.hears(Object.values(commandsMap).map(m => m.btn), (ctx) => {
  const modeKey = Object.keys(commandsMap).find(key => commandsMap[key].btn === ctx.text);
  if (modeKey) activateMode(ctx, modeKey);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const currentMode = userSessions[userId] || 'standart';
  const userMessage = ctx.message.text;

  if (currentMode === 'ivanovoleksandr') {
    try {
      const stickerSets = [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADEATHAAAAAAAAAAAAAAAAAAA', 
        'Meme_stickers'
      ];
      const randomSetName = stickerSets[Math.floor(Math.random() * stickerSets.length)];
      const stickerSet = await ctx.telegram.getStickerSet(randomSetName);
      const randomSticker = stickerSet.stickers[Math.floor(Math.random() * stickerSet.stickers.length)].file_id;
      await ctx.replyWithSticker(randomSticker);
    } catch (error) { 
      console.error("Sticker error:", error); 
      await ctx.reply("🙂"); 
    }
  }

  if (currentMode === 'sixseven') {
    try {
      const cringeStickers = [
        'fave2017', 
        'doomoarigatou', 
        'shit_tima_y', 
        'Monkey_pongifs2_by_fStikBot'
      ];
      const randomSetName = cringeStickers[Math.floor(Math.random() * cringeStickers.length)];
      const stickerSet = await ctx.telegram.getStickerSet(randomSetName);
      const randomSticker = stickerSet.stickers[Math.floor(Math.random() * stickerSet.stickers.length)].file_id;
      await ctx.replyWithSticker(randomSticker);
    } catch (error) { 
      console.error("Cringe sticker error:", error); 
    }
  }

    await ctx.sendChatAction('typing');
  

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Ти — "Генератор Локшини", бот для вигадування виправдань на будь-яку тему або придумування відповіді на повідомлення іншої людини. 
          Твій стиль зараз: ${modes[currentMode]}. 
          Користувач задає тобі питання: "${userMessage}"
          Відповідай правильною українською мовою, з правильним граматичними і синтаксичними формами. 
          Твоя відповідь має бути короткою (1-2 стислих речення), в режимі, який я вибрав, не подавай виду що ти машина.  
          Не використовуй вступні фрази "Ось твоє виправдання", не використовуй букви інших мов або зразу перекладай їх, просто пиши саму відповідь.
          У всіх режимах, крім "Радник відповідей", дай одну відповідь.
          У режимі "Радник відповідей" дай 2-5 варіантів відповіді на наведене повідомлення, кожен варіант з нового рядка і пронумерований (тільки в режимі "Радник відповідей").
          У режимі "Олександр Іванов" після стікера напиши коротку фразу (серйозно але з сарказмом), використовуючи переважно смайли 🙂 або 🤝 або 🤔або💀 або число 67 (коли не обов'язково надавати якусь відповідь).`
        },
        {
          role: "user",
          content: `Запитання: "${userMessage}"`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
    });

    const response = chatCompletion.choices[0]?.message?.content || "Щось пішло не так, локшина злиплася.";
    ctx.reply(response);

  } catch (error) {
    console.error("Помилка Groq:", error);
    ctx.reply("❌ Ой! ШІ перегрівся від такої нахабної брехні. Спробуй ще раз.");
  }
});

bot.launch();
console.log("Бот успішно запущений");


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));





bot.on('sticker', (ctx) => {
  ctx.reply('❌ Вибач, це дуже крутий стікер, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('photo', (ctx) => {
  ctx.reply('❌ Вибач, це дуже крута фотка, але я не можу її використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('video', (ctx) => {
  ctx.reply('❌ Вибач, це дуже цікаве відео, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('document', (ctx) => {
  ctx.reply('❌ Вибач, це дуже інформативний документ, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('audio', (ctx) => {
  ctx.reply('❌ Вибач, це дуже цікаве аудіо, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('voice', (ctx) => {
  ctx.reply('❌ Вибач, це дуже цікаве голосове повідомлення, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('video_note', (ctx) => {
  ctx.reply('❌ Вибач, це дуже цікавий кружечок, але я не можу його використовувати. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('contact', (ctx) => {
  ctx.reply('❌ Вибач, але я не буду дзвонити цій особі. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});
bot.on('location', (ctx) => {
  ctx.reply('❌ Вибач, але у мене зараз немає змоги приїхати туди. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
}); 
bot.on('poll', (ctx) => {
  ctx.reply('❌ Вибач, але я не вмію розрізняти опитування. Будь ласка, виберіть режим з меню нижче:', modeKeyboard);
});




import http from 'http';
http.createServer((req, res) => {
  res.write('Бот живий!');
  res.end();
}).listen(process.env.PORT || 3000);