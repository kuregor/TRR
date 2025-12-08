"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";

// TODO: подставь адрес своего токена в сети (Sepolia или другой)
const TOKEN_ADDRESS = "0xb8f6E68F308Fb544F75aAA30e2f841d112e66199";

// Минимальный ABI для нашего контракта Token
const TOKEN_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_symbol", type: "string" },
      { internalType: "uint256", name: "_totalSupply", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    // наша функция mint
    inputs: [
      { internalType: "address", name: "_account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Вспомогательная функция: из "1.23" → строка целого количества токенов в минимальных единицах
function toTokenUnits(amountStr: string, decimals: number): string {
  const normalized = amountStr.replace(",", ".").trim();
  if (!/^[0-9]+(\.[0-9]+)?$/.test(normalized)) {
    throw new Error("Некорректное число");
  }
  const [whole, fracRaw = ""] = normalized.split(".");
  const frac = fracRaw.slice(0, decimals); // отрезаем лишние знаки
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = whole + fracPadded;
  const noLeading = combined.replace(/^0+/, "") || "0";
  return noLeading;
}

// Обратное преобразование: из "1230000000000000000" → "1.23" (в строке)
function fromTokenUnits(raw: string, decimals: number): string {
  const rawBig = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = rawBig / base;
  const frac = rawBig % base;

  if (frac === 0n) {
    return whole.toString();
  }

  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr}`;
}

export default function Home() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [tokenContract, setTokenContract] = useState<any>(null);

  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string>("TKN");
  const [tokenName, setTokenName] = useState<string>("MyToken");
  const [decimals, setDecimals] = useState<number>(18);
  const [userBalanceRaw, setUserBalanceRaw] = useState<string>("0");
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");

  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!(window as any).ethereum) {
      alert("Установите MetaMask");
      return;
    }

    try {
      const web3Instance = new Web3((window as any).ethereum);
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const addr = accounts[0];
      setUserAddress(addr);
      setWeb3(web3Instance);

      const contract = new web3Instance.eth.Contract(
        TOKEN_ABI as any,
        TOKEN_ADDRESS
      );
      setTokenContract(contract);
    } catch (e: any) {
      console.error(e);
      alert("Ошибка подключения: " + (e?.message ?? e));
    }
  };

  // Загрузка данных о токене и балансе
  const loadTokenData = async () => {
    if (!tokenContract || !web3 || !userAddress) return;

    try {
      const [name, symbol, dec, ownerAddr, balance] = await Promise.all([
        tokenContract.methods.name().call(),
        tokenContract.methods.symbol().call(),
        tokenContract.methods.decimals().call(),
        tokenContract.methods.owner().call(),
        tokenContract.methods.balanceOf(userAddress).call(),
      ]);

      const decimalsNum = Number(dec);

      setTokenName(name);
      setTokenSymbol(symbol);
      setDecimals(decimalsNum);
      setUserBalanceRaw(balance.toString());

      setIsOwner(ownerAddr.toLowerCase() === userAddress.toLowerCase());
    } catch (e: any) {
      console.error("Ошибка чтения данных токена:", e);
      alert("Не удалось прочитать данные токена: " + (e?.message ?? e));
    }
  };

  useEffect(() => {
    if (tokenContract && userAddress && web3) {
      loadTokenData();
    }
  }, [tokenContract, userAddress, web3]);

  const handleTransfer = async () => {
    if (!tokenContract || !web3 || !userAddress) {
      alert("Сначала подключите кошелёк");
      return;
    }
    if (!transferTo.trim() || !transferAmount.trim()) {
      alert("Заполните адрес и сумму");
      return;
    }

    try {
      setLoading(true);
      const amountIntStr = toTokenUnits(transferAmount, decimals);

      const gas = await tokenContract.methods
        .transfer(transferTo, amountIntStr)
        .estimateGas({ from: userAddress });

      const tx = await tokenContract.methods
        .transfer(transferTo, amountIntStr)
        .send({ from: userAddress, gas });

      console.log("Transfer TX:", tx);
      setTransferAmount("");
      setTransferTo("");

      await loadTokenData();
    } catch (e: any) {
      console.error("Ошибка transfer:", e);
      alert("Ошибка перевода: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!tokenContract || !web3 || !userAddress) {
      alert("Сначала подключите кошелёк");
      return;
    }
    if (!isOwner) {
      alert("Только владелец контракта может чеканить токены");
      return;
    }
    if (!mintTo.trim() || !mintAmount.trim()) {
      alert("Заполните адрес и сумму для mint");
      return;
    }

    try {
      setLoading(true);
      const amountIntStr = toTokenUnits(mintAmount, decimals);

      const gas = await tokenContract.methods
        .mint(mintTo, amountIntStr)
        .estimateGas({ from: userAddress });

      const tx = await tokenContract.methods
        .mint(mintTo, amountIntStr)
        .send({ from: userAddress, gas });

      console.log("Mint TX:", tx);
      setMintAmount("");
      setMintTo("");

      await loadTokenData();
    } catch (e: any) {
      console.error("Ошибка mint:", e);
      alert("Ошибка при чеканке: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (!eth || !eth.request) {
      alert("MetaMask не найден / не поддерживает EIP-747");
      return;
    }

    try {
      await eth.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: TOKEN_ADDRESS,
            symbol: tokenSymbol || "TKN",
            decimals: decimals,
            // image: "https://example.com/logo.png",
          },
        },
      });
    } catch (e: any) {
      console.error("Ошибка wallet_watchAsset:", e);
      alert("Не удалось добавить токен в MetaMask: " + (e?.message ?? e));
    }
  };

  const formattedBalance = fromTokenUnits(userBalanceRaw, decimals);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold tracking-tight">
              Token dApp
            </h1>
            <p className="text-[11px] text-slate-400">
              Управление ERC-20 токеном: баланс, перевод и чеканка.
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
        {/* Левая колонка */}
        <div className="flex w-full flex-col gap-4 md:w-[50%]">
          {/* Инфа о токене / инструкции */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Подключение и токен</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              1. Подключите MetaMask. <br />
              2. Приложение прочитает имя, символ, decimals и ваш баланс. <br />
              3. Используйте формы ниже для перевода и чеканки токенов.
            </p>

            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px]">
              <div className="text-slate-400">Адрес токена:</div>
              <div className="mt-1 font-mono text-[10px] text-slate-200 break-all">
                {TOKEN_ADDRESS}
              </div>
            </div>
          </section>

          {/* Transfer */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Отправка токенов (transfer)
              </h2>
              {loading && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-amber-300">
                  Обработка…
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Переведите {tokenSymbol} на другой адрес.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-200">
                Адрес получателя
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="0x..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
              </label>

              <label className="block text-xs font-medium text-slate-200">
                Сумма
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder={`Сумма в ${tokenSymbol} (например, 1.5)`}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </label>

              <button
                onClick={handleTransfer}
                disabled={loading || !userAddress}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Выполнение…" : "Отправить"}
              </button>
            </div>
          </section>

          {/* Mint – только для владельца */}
          {isOwner && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Чеканка токенов (mint)</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Доступно только владельцу контракта. Позволяет выпускать новые
                токены.
              </p>

              <div className="mt-3 space-y-3">
                <label className="block text-xs font-medium text-slate-200">
                  Адрес получателя
                  <input
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Кто получит новые токены"
                    value={mintTo}
                    onChange={(e) => setMintTo(e.target.value)}
                  />
                </label>

                <label className="block text-xs font-medium text-slate-200">
                  Сумма
                  <input
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder={`Сумма в ${tokenSymbol} (например, 10)`}
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                  />
                </label>

                <button
                  onClick={handleMint}
                  disabled={loading || !userAddress}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Выполнение…" : "Чеканить токены"}
                </button>
              </div>
            </section>
          )}

          {/* Добавить в MetaMask */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Интеграция с MetaMask</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Добавьте токен в интерфейс MetaMask (EIP-747), чтобы видеть баланс
              прямо в кошельке.
            </p>
            <button
              onClick={handleAddToMetaMask}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-900"
            >
              Добавить токен в MetaMask
            </button>
          </section>
        </div>

        {/* Правая колонка */}
        <div className="hidden h-full flex-1 flex-col gap-4 md:flex">
          <section className="flex min-h-[360px] flex-1 flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Информация о токене</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Параметры токена и ваш текущий баланс.
                </p>
              </div>
              {loading && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] text-amber-300">
                  Обновление…
                </span>
              )}
            </div>

            <div className="flex-1 space-y-3 px-4 py-4 text-xs">
              <div className="rounded-lg bg-slate-900/80 px-3 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Токен
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-50">
                  {tokenName} ({tokenSymbol})
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Decimals:{" "}
                  <span className="font-mono text-slate-200">
                    {decimals}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Адрес контракта:
                  <div className="mt-1 truncate font-mono text-[10px] text-slate-300">
                    {TOKEN_ADDRESS}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/80 px-3 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Ваш баланс
                </div>
                <div className="mt-1 text-lg font-semibold text-emerald-300">
                  {formattedBalance} {tokenSymbol}
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/80 px-3 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Владелец контракта
                </div>
                <div className="mt-1 text-[13px]">
                  {isOwner ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                      Вы являетесь владельцем
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                      Вы не являетесь владельцем
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Только владелец может вызывать функцию{" "}
                  <span className="font-mono">mint</span> и выпускать новые
                  токены.
                </p>
              </div>
            </div>
          </section>

          {!userAddress && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100">
              Для работы с токеном подключите MetaMask в верхней панели.
            </div>
          )}
        </div>
      </main>

      {!userAddress && (
        <div className="px-4 pb-8 text-center text-xs text-slate-400 md:hidden">
          Для работы с приложением подключите кошелёк MetaMask.
        </div>
      )}
    </div>
  );
}
