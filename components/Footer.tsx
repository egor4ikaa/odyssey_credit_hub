'use client';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-500/10 bg-white/40 py-8 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          <div className="font-display font-bold text-gray-800">Odyssey Кредит Хаб © 2026</div>
          <div className="mt-1">Интеллектуальная мультибанковская экосистема кредитования бизнеса</div>
        </div>
        <div className="text-center md:text-right">
          <div className="font-medium text-gray-700">Команда: Odyssey | Разработчики: Ананиев Егор, Мокеев Богдан, Сижажев Олег, Зайнетдинов Искандер</div>
          <div className="mt-1">
            Поддержка и вопросы: <a href="mailto:egor7ananiev@mail.ru" className="text-brand-600 font-semibold hover:underline">egor7ananiev@mail.ru</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
