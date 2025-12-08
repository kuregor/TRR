"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";

const POSTER_ADDRESS = "0x38a12C83c2a834168d910BbAA47336b6787c575b";

const POSTER_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "content",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "tag",
        type: "string",
      },
    ],
    name: "NewPost",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "content",
        type: "string",
      },
      {
        internalType: "string",
        name: "tag",
        type: "string",
      },
    ],
    name: "post",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default function Home() {
  const [web3, setWeb3] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!(window as any).ethereum) {
      alert("Установите MetaMask");
      return;
    }

    const web3Instance = new Web3((window as any).ethereum);
    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0];
    setUserAddress(address);
    setWeb3(web3Instance);

    const c = new web3Instance.eth.Contract(POSTER_ABI, POSTER_ADDRESS);
    setContract(c);
  };

  const loadPosts = async () => {
    if (!contract || !web3) return;

    setLoading(true);
    try {
      const latestRaw = await web3.eth.getBlockNumber();
      const latest = Number(latestRaw);

      const RANGE = 20000;
      const fromBlock = Math.max(0, latest - RANGE);

      const events = await contract.getPastEvents("NewPost", {
        fromBlock,
        toBlock: "latest",
      });

      const mapped = events.map((e: any) => ({
        user: e.returnValues.user,
        content: e.returnValues.content,
        tag: e.returnValues.tag,
      }));

      setPosts(mapped);
    } catch (e: any) {
      console.error("Ошибка загрузки событий:", e);
      alert("Ошибка загрузки: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) loadPosts();
  }, [contract]);

  const handlePost = async () => {
    if (!contract || !userAddress) {
      alert("Кошелёк не подключен или контракт не инициализирован");
      return;
    }

    if (!content.trim() || !tag.trim()) {
      alert("Заполните и текст сообщения, и тег");
      return;
    }

    try {
      setLoading(true);

      const gas = await contract.methods
        .post(content, tag)
        .estimateGas({ from: userAddress });

      const tx = await contract.methods
        .post(content, tag)
        .send({ from: userAddress, gas });

      console.log("TX success:", tx);

      setContent("");
      setTag("");
      await loadPosts();
    } catch (e: any) {
      console.error("FULL ERROR OBJECT:", e);
      console.error("ERROR DATA:", e?.data);
      alert("Ошибка при отправке транзакции: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    filterTag ? p.tag.toLowerCase().includes(filterTag.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold tracking-tight">
              Poster dApp
            </h1>
            <p className="text-[11px] text-slate-400">
              Постинг сообщений в смарт-контракт и чтение событий NewPost из
              сети.
            </p>
          </div>

          {!userAddress ? (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-500/60 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/15 transition"
            >
              Подключить MetaMask
            </button>
          ) : (
            <div className="flex flex-col items-end text-right text-[11px]">
              <span className="text-slate-400">Адрес кошелька</span>
              <span className="mt-1 max-w-xs truncate rounded-md bg-slate-900 px-3 py-1 font-mono text-[10px]">
                {userAddress}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl gap-5 px-4 py-6">
        {/* Left column */}
        <div className="flex w-full flex-col gap-4 md:w-[45%]">
          {/* Info card */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Подключение</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              1. Подключите MetaMask.{" "}
              <br />
              2. Введите текст и тег. <br />
              3. Отправьте транзакцию в контракт Poster.
            </p>

            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px]">
              <span className="text-slate-400">Адрес Poster:</span>
              <div className="mt-1 font-mono text-[10px] text-slate-200 break-all">
                {POSTER_ADDRESS}
              </div>
            </div>
          </section>

          {/* New post form */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Создать пост</h2>
              {loading && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-amber-300">
                  Обработка…
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Сообщение и тег будут сохранены через событие NewPost в блокчейне.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-200">
                Текст сообщения
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  rows={4}
                  placeholder="Введите текст, который хотите отправить…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </label>

              <label className="block text-xs font-medium text-slate-200">
                Тег
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Например: general, dev, fun"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </label>

              <button
                onClick={handlePost}
                disabled={loading || !userAddress}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {userAddress
                  ? loading
                    ? "Отправка…"
                    : "Отправить пост"
                  : "Сначала подключите MetaMask"}
              </button>
            </div>
          </section>

          {/* Filter */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Фильтр по тегу</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Отображаются только те посты, тег которых содержит указанную
              подстроку.
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="Например: dev"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              />
              <button
                onClick={loadPosts}
                className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-800"
              >
                Обновить список постов
              </button>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="hidden h-full flex-1 flex-col gap-4 md:flex">
          <section className="flex min-h-[360px] flex-1 flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Лента постов</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  События NewPost, полученные из блокчейна.
                </p>
              </div>
              {loading && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] text-amber-300">
                  Загрузка…
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-xs">
              {!loading && filteredPosts.length === 0 && (
                <div className="mt-10 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-4 py-5 text-center text-[11px] text-slate-400">
                  Посты отсутствуют или не соответствуют фильтру по тегу.
                </div>
              )}

              {filteredPosts.map((p, i) => (
                <article
                  key={i}
                  className="relative flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="max-w-[70%] truncate font-mono text-[10px] text-slate-400">
                      {p.user}
                    </span>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                      {p.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-slate-50 whitespace-pre-wrap">
                    {p.content}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {!userAddress && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100">
              Для просмотра и отправки постов подключите MetaMask в верхней
              панели.
            </div>
          )}
        </div>

        {/* Mobile posts (when no right column) */}
        <div className="mt-4 flex w-full flex-col gap-3 md:hidden">
          <h2 className="text-sm font-semibold text-slate-100">
            Лента постов
          </h2>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
            {!loading && filteredPosts.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-4 text-center text-[11px] text-slate-400">
                Посты отсутствуют или не соответствуют фильтру по тегу.
              </div>
            )}

            {filteredPosts.map((p, i) => (
              <article
                key={i}
                className="relative flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="max-w-[70%] truncate font-mono text-[10px] text-slate-400">
                    {p.user}
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                    {p.tag}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-slate-50 whitespace-pre-wrap">
                  {p.content}
                </p>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
