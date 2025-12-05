"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";

const POSTER_ADDRESS = "0x693dCDaD69C23063EdB3dbAFe1F03F2576326a6E";

//import PosterArtifact from "../../artifacts/contracts/Poster.sol/Poster.json";

const POSTER_ABI = [
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
        "indexed": true,
        "internalType": "string",
        "name": "tag",
        "type": "string"
      }
    ],
    "name": "NewPost",
    "type": "event"
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
    "type": "function",
  }
]

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
      // 1) Получаем номер последнего блока как обычное число
      const latestRaw = await web3.eth.getBlockNumber();
      const latest = Number(latestRaw);

      // 2) Ограничение диапазона (например, последние 20 000 блоков)
      const RANGE = 20000;
      const fromBlock = Math.max(0, latest - RANGE);

      console.log("latest:", latest);
      console.log("fromBlock:", fromBlock);

      // 3) Загружаем события
      const events = await contract.getPastEvents("NewPost", {
        fromBlock: fromBlock,
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

      // сначала пробуем оценить газ, чтобы увидеть, не ревертится ли вызов
      const gas = await contract.methods
        .post(content, tag)
        .estimateGas({ from: userAddress });

      console.log("Estimated gas:", gas.toString());

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
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F5] p-8 font-sans">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl">

        {!userAddress ? (
          <button
            onClick={handleConnect}
            className="w-full py-4 rounded-xl bg-[#333333] text-white text-lg font-semibold hover:bg-[#4A4A4A] transition"
          >
            Connect MetaMask
          </button>
        ) : (
          <div className="space-y-6">

            {/* Connected address */}
            <div className="text-sm text-[#6B7280]">
              <span className="font-semibold text-[#1C1C1E]">Connected:</span>
              <br />
              <span className="break-all">{userAddress}</span>
            </div>

            {/* Create post */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-[#1C1C1E]">Создать пост</h2>

              <textarea
                className="w-full border rounded-xl p-3 text-sm text-[#1C1C1E] bg-[#F9FAFB]"
                rows={3}
                placeholder="Текст сообщения"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <input
                className="w-full border rounded-xl p-3 text-sm text-[#1C1C1E] bg-[#F9FAFB]"
                placeholder="Tag (строка)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />

              <button
                onClick={handlePost}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-[#333333] text-white text-sm font-medium hover:bg-[#4A4A4A] transition disabled:opacity-60"
              >
                {loading ? "Отправка..." : "Отправить в контракт"}
              </button>
            </div>

            {/* Filter */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-[#1C1C1E]">Фильтр по тегу</h2>
              <input
                className="w-full border rounded-xl p-3 text-sm text-[#1C1C1E] bg-[#F9FAFB]"
                placeholder="Введите строку для фильтрации по tag"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              />
              <button
                onClick={loadPosts}
                className="px-4 py-3 rounded-xl border text-sm font-medium hover:bg-[#F1F1F1] transition"
              >
                Обновить посты из блокчейна
              </button>
            </div>

            {/* Posts */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-[#1C1C1E]">Посты</h2>

              {loading && <div className="text-sm text-[#6B7280]">Загрузка…</div>}
              {!loading && filteredPosts.length === 0 && (
                <div className="text-sm text-[#6B7280]">Постов пока нет</div>
              )}

              {filteredPosts.map((p, i) => (
                <div key={i} className="border rounded-xl p-4 bg-[#F9FAFB] text-sm">
                  <div className="text-xs text-[#6B7280] mb-1">
                    User: {p.user}
                  </div>
                  <div className="text-[#1C1C1E] mb-1">{p.content}</div>
                  <div className="text-xs text-[#6B7280]">
                    Tag (indexed): {p.tag}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
