import { useState, useEffect, useRef } from "react";
import {
  LogIn, LogOut, PackagePlus, PackageMinus, Search,
  CheckCircle, Clock, ChevronDown, X, Box
} from "lucide-react";

const SESSION_KEY = "cafe_session";
const SESSION_TTL = 10 * 60 * 60 * 1000; // 10 horas

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center sm:p-4">
      <div className="w-full max-w-md bg-gray-900 min-h-screen sm:min-h-[850px] sm:h-[850px] sm:rounded-[2.5rem] sm:border-[6px] border-gray-800 flex flex-col overflow-hidden shadow-2xl relative">
        {children}
      </div>
    </div>
  );
}

function Toast({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  
  const isError = toast.type === "error";
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 ${isError ? "bg-red-600" : "bg-green-600"} text-white px-5 py-3 rounded-2xl shadow-xl text-base font-semibold animate-bounce`}>
      <CheckCircle size={20} /> {toast.message}
    </div>
  );
}

function Combobox({ value, onChange, products }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    String(p.id).includes(query)
  );

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = p => {
    onChange(p);
    setQuery(p.name);
    setOpen(false);
  };

  const clear = () => { onChange(null); setQuery(""); };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-gray-800 border-2 border-gray-600 rounded-xl overflow-hidden focus-within:border-yellow-400 transition-colors">
        <Search size={18} className="ml-3 text-gray-400 shrink-0" />
        <input
          className="flex-1 bg-transparent text-white text-lg px-3 py-4 outline-none placeholder-gray-500"
          placeholder="Buscar producto o código..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(null); }}
          onFocus={() => setOpen(true)}
        />
        {value ? (
          <button onClick={clear} className="p-3 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        ) : (
          <ChevronDown size={18} className="mr-3 text-gray-400" />
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-40 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
          {filtered.map(p => (
            <li
              key={p.db_id}
              onMouseDown={() => select(p)}
              className="flex items-center justify-between px-4 py-4 text-gray-200 hover:bg-yellow-500 hover:text-black cursor-pointer transition-colors border-b border-gray-700 last:border-0"
            >
              <div className="font-bold text-base">{p.name}</div>
              <div className="text-sm font-bold bg-black/20 px-2 py-1 rounded-lg shrink-0 ml-2">
                {Number(p.stock_actual)} {p.unit}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-40 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-4 text-gray-400 text-sm">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, team }) {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/api/operarios/${selected.id}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        onLogin(selected);
      } else {
        setError("Contraseña incorrecta");
      }
    } catch (e) {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto w-full flex flex-col px-4 py-8">
        <div className="m-auto flex flex-col items-center gap-6 w-full max-w-xs">
          <div className="flex flex-col items-center gap-2 mb-2">
            <img src="/logo.png" alt="Sitcom Logo" className="w-32 h-auto drop-shadow-xl" />
            <h1 className="text-3xl font-black text-white tracking-tight mt-2 text-center">Sitcom Inventario</h1>
            <p className="text-gray-400 text-sm text-center">Selecciona tu nombre para entrar</p>
          </div>
          <div className="w-full flex flex-col gap-3">
        {team.length === 0 && <p className="text-center text-gray-500 font-semibold py-4">Cargando equipo...</p>}
        {team.map(op => (
          <button
            key={op.id}
            onClick={() => { setSelected(op); setPassword(""); setError(null); }}
            className={`w-full py-4 rounded-2xl text-xl font-bold transition-all border-2 ${
              selected?.id === op.id
                ? "bg-yellow-400 text-black border-yellow-300 scale-105"
                : "bg-gray-800 text-white border-gray-700 hover:border-yellow-400"
            }`}
          >
            {op.nombre}
          </button>
        ))}
          </div>
          {selected && (
            <div className="w-full flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-4">
              <input
                type="password"
                placeholder="Ingresa tu clave"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-600 focus:border-yellow-400 text-white text-center text-2xl font-bold px-4 py-3 rounded-xl outline-none"
              />
              {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
              <button
                disabled={!password || loading}
                onClick={handleLogin}
                className="w-full py-4 rounded-2xl text-xl font-black bg-yellow-400 text-black disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
              >
                {loading ? "Verificando..." : <><LogIn size={22} /> Entrar</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function MovementForm({ type, user, onSave, onCancel, products }) {
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const isEntry = type === "entrada";

  const handleSubmit = () => {
    if (!product || !qty || Number(qty) <= 0) return;
    const mov = {
      producto: product.db_id,
      operario: user.id,
      tipo_movimiento: type.toUpperCase(),
      cantidad: Number(qty),
      observaciones: observaciones
    };
    onSave(mov);
  };

  const isInvalidQty = !isEntry && (Number(qty) > (product?.stock_actual || 0));
  
  const accent = isEntry ? "green" : "orange";
  const Icon = isEntry ? PackagePlus : PackageMinus;
  const label = isEntry ? "ENTRADA" : "SALIDA";

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <div className={`px-4 py-4 flex items-center gap-3 ${isEntry ? "bg-green-700" : "bg-orange-700"}`}>
        <button onClick={onCancel} className="text-white/70 hover:text-white p-1">
          <X size={26} />
        </button>
        <Icon size={26} className="text-white" />
        <h2 className="text-xl font-black text-white tracking-wide">Registrar {label}</h2>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-5">
        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wider">Producto</label>
          <Combobox value={product} onChange={setProduct} products={products} />
          {product && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs bg-gray-700 text-yellow-400 px-3 py-1 rounded-full font-bold">
                #{product.id} · {product.unit}
              </span>
              <span className="text-xs bg-gray-700 text-green-400 px-3 py-1 rounded-full font-bold">
                Disponible: {product.stock_actual} {product.unit}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wider">
            Cantidad {product ? `(${product.unit})` : ""}
          </label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={qty}
            onChange={e => setQty(e.target.value)}
            onKeyDown={e => {
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
            placeholder="0.000"
            className={`w-full bg-gray-800 border-2 ${isInvalidQty ? 'border-red-500 focus:border-red-500 text-red-400' : 'border-gray-600 focus:border-yellow-400 text-white'} text-3xl font-bold px-4 py-4 rounded-xl outline-none text-center tracking-widest transition-colors`}
          />
          {isInvalidQty && (
            <div className="text-red-500 text-sm text-center font-bold mt-2">
              No puedes retirar más de lo disponible
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wider">
            Observaciones <span className="text-gray-600 lowercase">(opcional)</span>
          </label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Motivo de la salida o nota adicional..."
            className="w-full bg-gray-800 border-2 border-gray-600 focus:border-yellow-400 text-white text-lg font-medium px-4 py-3 rounded-xl outline-none resize-none transition-colors"
            rows="2"
          ></textarea>
        </div>

        <div className="mt-auto pt-4">
          <div className="text-center text-xs text-gray-500 mb-3">
            <Clock size={12} className="inline mr-1" />
            Fecha y hora se registran automáticamente · Usuario: <span className="text-yellow-400 font-bold">{user.nombre}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!product || !qty || Number(qty) <= 0 || isInvalidQty}
            className={`w-full py-5 rounded-2xl text-2xl font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
              isEntry ? "bg-green-500 hover:bg-green-400 text-white" : "bg-orange-500 hover:bg-orange-400 text-white"
            }`}
          >
            <Icon size={28} /> CONFIRMAR {label}
          </button>
        </div>
      </div>
      </div>
    </Layout>
  );
}

export default function App() {
  const [session, setSession] = useState(null); // Guardará el objeto operario {id, nombre}
  const [movements, setMovements] = useState([]);
  const [view, setView] = useState("dashboard"); // dashboard | entrada | salida
  const [toast, setToast] = useState(null);

  const [dbProducts, setDbProducts] = useState([]);
  const [dbTeam, setDbTeam] = useState([]);

  useEffect(() => {
    // 1. Cargar Sesión
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (s && Date.now() - s.ts < SESSION_TTL) setSession(s.user);
    } catch {}

    // 2. Fetch Datos API
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const [opsRes, prodRes, movsRes] = await Promise.all([
          fetch(`${API_URL}/api/operarios/`),
          fetch(`${API_URL}/api/productos/`),
          fetch(`${API_URL}/api/movimientos/`)
        ]);

        if (opsRes.ok) setDbTeam(await opsRes.json());
        
        if (prodRes.ok) {
          const data = await prodRes.json();
          setDbProducts(data.map(p => ({
            id: p.codigo,
            db_id: p.id,
            name: p.descripcion,
            unit: p.unidad_medida,
            stock_actual: p.stock_actual
          })));
        }

        if (movsRes.ok) setMovements(await movsRes.json());
      } catch (err) {
        console.error("Error al obtener datos:", err);
      }
    };
    
    fetchData();
  }, []);

  const login = user => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, ts: Date.now() }));
    setSession(user);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const saveMovement = async (movData) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/movimientos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movData)
      });

      if (response.ok) {
        const newMov = await response.json();
        setMovements([newMov, ...movements]);
        
        // Actualizar el stock local para reflejar el movimiento sin recargar
        setDbProducts(prev => prev.map(p => {
          if (p.db_id === newMov.producto) {
            const qty = Number(newMov.cantidad);
            const isEntry = newMov.tipo_movimiento === 'ENTRADA';
            return {
              ...p,
              stock_actual: isEntry ? p.stock_actual + qty : p.stock_actual - qty
            };
          }
          return p;
        }));

        setToast({ type: "success", message: "Movimiento registrado" });
        setView("dashboard");
      } else {
        const errData = await response.json();
        throw new Error(`Validation Error: ${JSON.stringify(errData)}`);
      }
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "❌ Error: Cantidad inválida o error en servidor" });
    }
  };

  // Filtrar movimientos de hoy (usando la fecha Django: 'fecha_hora')
  const today = new Date().toLocaleDateString("es-BO");
  const todayMovs = movements.filter(m => {
    const d = new Date(m.fecha_hora);
    return d.toLocaleDateString("es-BO") === today;
  });

  if (!session) return <LoginScreen onLogin={login} team={dbTeam} />;

  if (view === "entrada" || view === "salida") {
    return (
      <>
        {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        <MovementForm
          type={view}
          user={session}
          onSave={saveMovement}
          onCancel={() => setView("dashboard")}
          products={dbProducts}
        />
      </>
    );
  }

  return (
    <Layout>
      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="text-white font-black text-lg tracking-tight">Sitcom Inventario</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm font-bold">{session.nombre}</span>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 p-1 transition-colors" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pt-5 pb-3 grid grid-cols-2 gap-4">
        <button
          onClick={() => setView("salida")}
          className="flex flex-col items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white rounded-2xl py-8 font-black text-xl shadow-lg shadow-orange-900/40 transition-all"
        >
          <PackageMinus size={36} />
          SALIDA
        </button>
        <button
          onClick={() => setView("entrada")}
          className="flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:scale-95 text-white rounded-2xl py-8 font-black text-xl shadow-lg shadow-green-900/40 transition-all"
        >
          <PackagePlus size={36} />
          ENTRADA
        </button>
      </div>

      {/* Stats bar */}
      <div className="mx-4 mb-3 grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl px-4 py-3 text-center">
          <div className="text-2xl font-black text-orange-400">{todayMovs.filter(m => m.tipo_movimiento === "SALIDA").length}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Salidas hoy</div>
        </div>
        <div className="bg-gray-800 rounded-xl px-4 py-3 text-center">
          <div className="text-2xl font-black text-green-400">{todayMovs.filter(m => m.tipo_movimiento === "ENTRADA").length}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Entradas hoy</div>
        </div>
      </div>

      {/* Movements List */}
      <div className="flex-1 px-4 pb-6">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
          <Clock size={13} /> Últimos movimientos hoy
        </h3>
        {todayMovs.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            Sin movimientos registrados hoy
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayMovs.slice(0, 20).map(m => (
              <div key={m.id} className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full shrink-0 ${m.tipo_movimiento === "ENTRADA" ? "bg-green-500" : "bg-orange-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{m.producto_descripcion}</div>
                  <div className="text-gray-400 text-xs">{m.operario_nombre} · {new Date(m.fecha_hora).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-black text-base ${m.tipo_movimiento === "ENTRADA" ? "text-green-400" : "text-orange-400"}`}>
                    {m.tipo_movimiento === "ENTRADA" ? "+" : "-"}{Number(m.cantidad)}
                  </div>
                  <div className="text-gray-500 text-xs">{m.producto_unidad}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}