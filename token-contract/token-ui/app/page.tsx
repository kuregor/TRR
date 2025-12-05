"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";

// TODO: подставь адрес своего токена в сети (Sepolia или другой)
const TOKEN_ADDRESS = "0x6a3586a1c893c35a1777fcc24e40eb898a95a474";

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
            // image: "https://example.com/logo.png", // можно добавить логотип
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
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {!userAddress ? (
          <button
            onClick={handleConnect}
            className="w-full py-4 rounded-xl bg-[#111827] text-white text-lg font-semibold hover:bg-[#1F2937] transition"
          >
            Подключить MetaMask
          </button>
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#111827]">
                  Подключённый адрес:
                </span>
                <br />
                <span className="break-all">{userAddress}</span>
              </div>
              <div className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#111827]">
                  Токен:
                </span>{" "}
                {tokenName} ({tokenSymbol}), decimals = {decimals}
                <br />
                <span className="font-semibold text-[#111827]">
                  Ваш баланс:
                </span>{" "}
                {formattedBalance} {tokenSymbol}
              </div>
              <div className="text-xs text-[#6B7280]">
                Владелец контракта:{" "}
                {isOwner ? (
                  <span className="text-green-600 font-semibold">
                    вы являетесь владельцем
                  </span>
                ) : (
                  <span className="text-[#6B7280]">
                    вы не являетесь владельцем
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
              <h2 className="text-lg font-semibold text-[#111827]">
                Отправить токен (transfer)
              </h2>
              <input
                className="w-full border rounded-xl p-3 text-sm bg-[#F9FAFB] text-[#111827]"
                placeholder="Адрес получателя"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
              <input
                className="w-full border rounded-xl p-3 text-sm bg-[#F9FAFB] text-[#111827]"
                placeholder={`Сумма в ${tokenSymbol} (например, 1.5)`}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <button
                onClick={handleTransfer}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition disabled:opacity-60"
              >
                {loading ? "Выполнение..." : "Отправить токены"}
              </button>
            </div>

            {isOwner && (
              <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Чеканка токенов (mint) – только для владельца
                </h2>
                <input
                  className="w-full border rounded-xl p-3 text-sm bg-[#F9FAFB] text-[#111827]"
                  placeholder="Адрес получателя (кто получит новые токены)"
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                />
                <input
                  className="w-full border rounded-xl p-3 text-sm bg-[#F9FAFB] text-[#111827]"
                  placeholder={`Сумма в ${tokenSymbol} (например, 10)`}
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
                <button
                  onClick={handleMint}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition disabled:opacity-60"
                >
                  {loading ? "Выполнение..." : "Чеканить токены"}
                </button>
              </div>
            )}

            <div className="border-t border-[#E5E7EB] pt-4">
              <button
                onClick={handleAddToMetaMask}
                className="px-4 py-3 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#111827] hover:bg-[#F3F4F6] transition"
              >
                Добавить токен в MetaMask (EIP-747)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
