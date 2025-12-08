"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";

const POSTER_ADDRESS = "0x416790015c873A161a478820c1291191A2D5c5Ef"; // ЗАМЕНИТЬ на адрес Poster из Sepolia

// ABI контракта Poster с учётом новых полей tokenAddress и threshold
const POSTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_threshold",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tag",
        "type": "string"
      }
    ],
    "name": "NewPost",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "tag",
        "type": "string"
      }
    ],
    "name": "post",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newThreshold",
        "type": "uint256"
      }
    ],
    "name": "setThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newTokenAddress",
        "type": "address"
      }
    ],
    "name": "setTokenAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "threshold",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

// Минимальный ABI токена ERC-20: balanceOf + decimals
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_totalSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

type Post = {
  user: string;
  content: string;
  tag: string;
};

export default function Home() {
  const [web3, setWeb3] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const [posterContract, setPosterContract] = useState<any>(null);
  const [tokenContract, setTokenContract] = useState<any>(null);

  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [thresholdRaw, setThresholdRaw] = useState<string>("0");
  const [decimals, setDecimals] = useState<number>(18);

  const [userTokenBalanceRaw, setUserTokenBalanceRaw] = useState<string>("0");

  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);

    const anyWindow = window as any;

    if (!anyWindow.ethereum) {
      alert("Установите MetaMask");
      return;
    }

    try {
      const web3Instance = new Web3(anyWindow.ethereum);

      const accounts = await anyWindow.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];

      setWeb3(web3Instance);
      setUserAddress(address);

      const poster = new web3Instance.eth.Contract(POSTER_ABI as any, POSTER_ADDRESS);
      setPosterContract(poster);

      // Читаем адрес токена и порог из Poster
      const tAddress: string = await poster.methods.tokenAddress().call();
      const tThreshold: string = await poster.methods.threshold().call();

      setTokenAddress(tAddress);
      setThresholdRaw(tThreshold);

      // Если адрес токена ненулевой, создаём контракт и читаем decimals + баланс
      if (
        tAddress &&
        tAddress !== "0x0000000000000000000000000000000000000000"
      ) {
        const token = new web3Instance.eth.Contract(ERC20_ABI as any, tAddress);
        setTokenContract(token);

        try {
          const decStr: string = await token.methods.decimals().call();
          const decNum = Number(decStr);
          setDecimals(decNum);
        } catch (_) {
          // если decimals не получилось прочитать, оставим 18 по умолчанию
          setDecimals(18);
        }

        await loadUserTokenBalance(web3Instance, token, address);
      } else {
        setTokenContract(null);
      }

      // Загрузка постов после инициализации контракта
      await loadPosts(web3Instance, poster);
    } catch (e: any) {
      console.error("Ошибка подключения:", e);
      setError(e?.message ?? String(e));
    }
  };

  const loadUserTokenBalance = async (
    web3Instance: any,
    token: any,
    address: string
  ) => {
    try {
      const balance: string = await token.methods.balanceOf(address).call();
      setUserTokenBalanceRaw(balance);
    } catch (e: any) {
      console.error("Ошибка чтения баланса токена:", e);
      setError("Не удалось прочитать баланс токена");
      setUserTokenBalanceRaw("0");
    }
  };

  const loadPosts = async (web3Instance?: any, poster?: any) => {
    const w3 = web3Instance ?? web3;
    const p = poster ?? posterContract;

    if (!w3 || !p) return;

    setLoading(true);
    setError(null);

    try {
      const latestRaw = await w3.eth.getBlockNumber();
      const latest = Number(latestRaw);
      const RANGE = 20000;
      const fromBlock = Math.max(0, latest - RANGE);

      const events = await p.getPastEvents("NewPost", {
        fromBlock,
        toBlock: "latest",
      });

      const mapped: Post[] = events.map((e: any) => ({
        user: e.returnValues.user,
        content: e.returnValues.content,
        tag: e.returnValues.tag,
      }));

      setPosts(mapped);
    } catch (e: any) {
      console.error("Ошибка загрузки событий:", e);
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // автообновление постов, когда появился контракт
    if (web3 && posterContract) {
      loadPosts();
    }
  }, [web3, posterContract]);

  useEffect(() => {
    // автообновление баланса токена при смене токен-контракта или адреса пользователя
    if (web3 && tokenContract && userAddress) {
      loadUserTokenBalance(web3, tokenContract, userAddress);
    }
  }, [web3, tokenContract, userAddress]);

  const handlePost = async () => {
    if (!web3 || !posterContract || !userAddress) {
      alert("Кошелёк или контракт не инициализированы");
      return;
    }

    if (!content.trim() || !tag.trim()) {
      alert("Заполните и текст сообщения, и тег");
      return;
    }

    if (!tokenContract || !tokenAddress) {
      alert("Адрес токена в контракте Poster не настроен");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // читаем актуальный баланс и порог
      const balanceRaw: string = await tokenContract.methods
        .balanceOf(userAddress)
        .call();

      setUserTokenBalanceRaw(balanceRaw);

      const thresholdStr: string = await posterContract.methods
        .threshold()
        .call();

      setThresholdRaw(thresholdStr);

      const bnBalance = BigInt(balanceRaw);
      const bnThreshold = BigInt(thresholdStr);

      if (bnBalance < bnThreshold) {
        const humanBalance =
          Number(balanceRaw) / Math.pow(10, decimals || 18);
        const humanThreshold =
          Number(thresholdStr) / Math.pow(10, decimals || 18);

        alert(
          `Недостаточно токенов для постинга.\n` +
          `Ваш баланс: ~${humanBalance} токенов\n` +
          `Минимальный порог: ~${humanThreshold} токенов`
        );

        return;
      }


      // если токенов хватает — отправляем транзакцию post
      const gas = await posterContract.methods
        .post(content, tag)
        .estimateGas({ from: userAddress });

      await posterContract.methods
        .post(content, tag)
        .send({ from: userAddress, gas });

      setContent("");
      setTag("");

      await loadPosts();
    } catch (e: any) {
      console.error("Ошибка при отправке транзакции:", e);
      setError(e?.message ?? String(e));
      alert("Ошибка при отправке транзакции: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    filterTag ? p.tag.toLowerCase().includes(filterTag.toLowerCase()) : true
  );

  // человекочитаемые числа для UI (округлённые)
  const humanBalance =
    Number(userTokenBalanceRaw || "0") / Math.pow(10, decimals || 18);
  const humanThreshold =
    Number(thresholdRaw || "0") / Math.pow(10, decimals || 18);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold tracking-tight">
              Poster dApp с токен-гейтингом
            </h1>
            <p className="text-[11px] text-slate-400">
              Публикация сообщений доступна только адресам с достаточным балансом
              токенов ERC-20.
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

      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            Ошибка: {error}
          </div>
        )}

        {userAddress ? (
          <div className="flex flex-col gap-5 md:flex-row">
            {/* Левая колонка: токены + форма постинга + фильтр */}
            <section className="flex w-full flex-col gap-4 md:w-[50%]">
              {/* Информация о токене и пороге */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <h2 className="text-sm font-semibold">Токен доступа</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Контракт Poster хранит адрес токена и порог в переменных{" "}
                  <span className="font-mono text-[10px]">tokenAddress</span> и{" "}
                  <span className="font-mono text-[10px]">threshold</span>. Перед
                  постингом dApp проверяет баланс через контракт ERC-20.
                </p>

                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Адрес Poster</dt>
                    <dd className="max-w-[60%] truncate font-mono text-[10px] text-slate-200">
                      {POSTER_ADDRESS}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Адрес токена</dt>
                    <dd className="max-w-[60%] truncate font-mono text-[10px] text-slate-200">
                      {tokenAddress ??
                        "0x0000000000000000000000000000000000000000"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Порог (threshold)</dt>
                    <dd className="text-right text-slate-100">
                      ~{humanThreshold.toLocaleString("ru-RU")} токенов
                    </dd>
                  </div>

                  <div className="mt-2 flex justify-between gap-3 border-t border-slate-800 pt-2">
                    <dt className="text-slate-400">Ваш баланс токена</dt>
                    <dd className="text-right font-semibold text-emerald-300">
                      ~{humanBalance.toLocaleString("ru-RU")} токенов
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Форма нового поста */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Новый пост</h2>
                  {loading && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-amber-300">
                      Обработка…
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Сообщение будет записано в контракт Poster только если ваш
                  баланс токена превышает пороговое значение.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-200">
                    Текст сообщения
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      rows={4}
                      placeholder="Введите текст, который хотите отправить в контракт…"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-200">
                    Тег (строка)
                    <input
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Например: general, dev, fun"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </label>

                  <div className="mt-2 flex flex-col gap-2 text-[11px] text-slate-400">
                    <span>
                      Адрес контракта Poster:{" "}
                      <span className="font-mono text-[10px] text-slate-200">
                        {POSTER_ADDRESS}
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={handlePost}
                    disabled={loading}
                    className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Обработка…" : "Отправить пост"}
                  </button>
                </div>
              </div>

              {/* Фильтр по тегу */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <h2 className="text-sm font-semibold">Фильтр по тегу</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Отображаются только те события, поле <span className="font-mono">tag</span> которых
                  содержит указанную подстроку.
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Например: dev"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                  />
                  <button
                    onClick={() => loadPosts()}
                    className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-900"
                  >
                    Обновить события
                  </button>
                </div>
              </div>
            </section>

            {/* Правая колонка: события NewPost */}
            <section className="hidden h-full flex-1 flex-col gap-4 md:flex">
              <div className="flex min-h-[360px] flex-1 flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">События NewPost</h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      История сообщений, полученных из блокчейна.
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
                    <div className="mt-6 rounded-lg border border-dashed border-slate-700 bg-slate-900/70 px-4 py-5 text-center text-[11px] text-slate-400">
                      Постов пока нет или они не подходят под фильтр.
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
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
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
            </section>

            {/* Лента постов на мобильных (когда правая колонка скрыта) */}
            <section className="mt-4 w-full md:hidden">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">
                События NewPost
              </h2>
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
                {!loading && filteredPosts.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 px-3 py-4 text-center text-[11px] text-slate-400">
                    Постов пока нет или они не подходят под фильтр.
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
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
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
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-8 text-center text-sm text-slate-300">
            Для работы с приложением подключите кошелёк MetaMask в верхней панели.
          </div>
        )}
      </main>
    </div>
  );
}
