import { supabase } from './supabaseClient.js'

// Variável de controle do modo
let modoDemo = false
let usuarioAtual = null

// Chave para localStorage do modo demo
const STORAGE_KEY_DEMO = 'lista_compras_demo'

// Verifica se deve usar modo demo
async function verificarModoDemo() {
    // Verifica se há uma preferência salva
    const modoSalvo = localStorage.getItem('modo_demo')
    if (modoSalvo === 'true') {
        modoDemo = true
        return true
    }
    
    // Tenta fazer login automático (guest)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            modoDemo = false
            usuarioAtual = user
            return false
        }
    } catch (error) {
        console.log('Erro ao verificar usuário:', error)
    }
    
    return false
}

// Função para ativar modo demo
window.ativarModoDemo = function() {
    localStorage.setItem('modo_demo', 'true')
    modoDemo = true
    usuarioAtual = null
    alert('Modo Demo ativado! Você pode usar a lista sem fazer login.')
    carregarLista()
}

// Função para sair do modo demo e tentar login
window.sairModoDemo = function() {
    localStorage.removeItem('modo_demo')
    modoDemo = false
    window.location.href = 'login.html'
}

// Função para fazer logout completo
window.logout = async function() {
    if (modoDemo) {
        if (confirm('Sair do modo demo? Você pode fazer login para salvar sua lista na nuvem.')) {
            sairModoDemo()
        }
    } else {
        await supabase.auth.signOut()
        localStorage.removeItem('modo_demo')
        window.location.href = 'login.html'
    }
}

// Elementos do DOM
const lista = document.getElementById('lista')
const input = document.getElementById('item')
const btnModoDemo = document.getElementById('btnModoDemo')
const statusModo = document.getElementById('statusModo')

// ========== FUNÇÕES DO MODO DEMO (localStorage) ==========
function getItensDemo() {
    const dados = localStorage.getItem(STORAGE_KEY_DEMO)
    return dados ? JSON.parse(dados) : []
}

function salvarItensDemo(itens) {
    localStorage.setItem(STORAGE_KEY_DEMO, JSON.stringify(itens))
}

async function carregarListaDemo() {
    const itens = getItensDemo()
    renderizarLista(itens)
}

async function adicionarItemDemo(itemTexto) {
    const itens = getItensDemo()
    const novoItem = {
        id: Date.now().toString(),
        item: itemTexto,
        concluido: false,
        data_criacao: new Date().toISOString()
    }
    itens.push(novoItem)
    salvarItensDemo(itens)
    carregarListaDemo()
}

async function removerItemDemo(id) {
    const itens = getItensDemo()
    const itensFiltrados = itens.filter(item => item.id !== id)
    salvarItensDemo(itensFiltrados)
    carregarListaDemo()
}

async function toggleItemDemo(id) {
    const itens = getItensDemo()
    const item = itens.find(item => item.id === id)
    if (item) {
        item.concluido = !item.concluido
        salvarItensDemo(itens)
        carregarListaDemo()
    }
}

// ========== FUNÇÕES DO SUPABASE (com login) ==========
async function carregarListaSupabase() {
    const { data, error } = await supabase
        .from('lista_compras')
        .select('*')
        .order('data_criacao', { ascending: false })
    
    if (error) {
        console.error('Erro ao carregar lista:', error)
        return
    }
    
    renderizarLista(data)
}

async function adicionarItemSupabase(itemTexto) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert('Sessão expirada! Ative o modo demo ou faça login novamente.')
        return false
    }
    
    const { error } = await supabase.from('lista_compras').insert({
        item: itemTexto,
        adicionado_por: user.id,
        concluido: false,
        data_criacao: new Date().toISOString()
    })
    
    if (error) {
        alert('Erro ao adicionar: ' + error.message)
        return false
    }
    
    return true
}

async function removerItemSupabase(id) {
    const { error } = await supabase.from('lista_compras').delete().eq('id', id)
    if (error) {
        alert('Erro ao remover: ' + error.message)
        return false
    }
    return true
}

async function toggleItemSupabase(id, concluidoAtual) {
    const { error } = await supabase
        .from('lista_compras')
        .update({ concluido: !concluidoAtual })
        .eq('id', id)
    
    if (error) {
        alert('Erro ao atualizar: ' + error.message)
        return false
    }
    return true
}

// ========== FUNÇÕES GENÉRICAS (funcionam nos dois modos) ==========
function renderizarLista(itens) {
    if (!lista) return
    
    if (itens.length === 0) {
        lista.innerHTML = '<li style="color: #999; text-align: center; padding: 20px;">📭 Nenhum item na lista</li>'
        return
    }
    
    lista.innerHTML = ''
    itens.forEach((item) => {
        const li = document.createElement('li')
        li.style.display = 'flex'
        li.style.justifyContent = 'space-between'
        li.style.alignItems = 'center'
        li.style.padding = '10px'
        li.style.margin = '5px 0'
        li.style.background = '#f8f9fa'
        li.style.borderRadius = '8px'
        li.style.transition = 'all 0.3s'
        
        // Texto do item
        const span = document.createElement('span')
        span.textContent = item.item
        span.style.flex = '1'
        span.style.cursor = 'pointer'
        if (item.concluido) {
            span.style.textDecoration = 'line-through'
            span.style.color = '#888'
        }
        span.onclick = () => toggleItem(item.id, item.concluido)
        
        // Container dos botões
        const divBotoes = document.createElement('div')
        divBotoes.style.display = 'flex'
        divBotoes.style.gap = '8px'
        
        // Botão toggle
        const btnToggle = document.createElement('button')
        btnToggle.textContent = item.concluido ? '↺ Desfazer' : '✓ Concluir'
        btnToggle.style.background = item.concluido ? '#ff9800' : '#4CAF50'
        btnToggle.style.color = 'white'
        btnToggle.style.border = 'none'
        btnToggle.style.borderRadius = '5px'
        btnToggle.style.padding = '5px 12px'
        btnToggle.style.cursor = 'pointer'
        btnToggle.style.fontSize = '12px'
        btnToggle.onclick = () => toggleItem(item.id, item.concluido)
        
        // Botão remover
        const btnRemover = document.createElement('button')
        btnRemover.textContent = '🗑️ Remover'
        btnRemover.style.background = '#dc3545'
        btnRemover.style.color = 'white'
        btnRemover.style.border = 'none'
        btnRemover.style.borderRadius = '5px'
        btnRemover.style.padding = '5px 12px'
        btnRemover.style.cursor = 'pointer'
        btnRemover.style.fontSize = '12px'
        btnRemover.onclick = () => removerItem(item.id)
        
        divBotoes.appendChild(btnToggle)
        divBotoes.appendChild(btnRemover)
        li.appendChild(span)
        li.appendChild(divBotoes)
        lista.appendChild(li)
    })
}

// Função principal para carregar lista (decide qual modo usar)
async function carregarLista() {
    if (modoDemo) {
        await carregarListaDemo()
        atualizarStatusModo('demo')
    } else {
        await carregarListaSupabase()
        atualizarStatusModo('supabase')
    }
}

// Função principal para adicionar item
window.adicionarItem = async function() {
    const texto = input.value.trim()
    
    if (texto === '') {
        alert('Digite um item válido')
        return
    }
    
    let sucesso = false
    
    if (modoDemo) {
        await adicionarItemDemo(texto)
        sucesso = true
    } else {
        sucesso = await adicionarItemSupabase(texto)
    }
    
    if (sucesso) {
        input.value = ''
        carregarLista()
        input.focus()
    }
}

// Função principal para remover item
window.removerItem = async function(id) {
    if (!confirm('Remover este item?')) return
    
    let sucesso = false
    
    if (modoDemo) {
        await removerItemDemo(id)
        sucesso = true
    } else {
        sucesso = await removerItemSupabase(id)
    }
    
    if (sucesso) {
        carregarLista()
    }
}

// Função principal para alternar status do item
window.toggleItem = async function(id, concluidoAtual) {
    let sucesso = false
    
    if (modoDemo) {
        await toggleItemDemo(id)
        sucesso = true
    } else {
        sucesso = await toggleItemSupabase(id, concluidoAtual)
    }
    
    if (sucesso) {
        carregarLista()
    }
}

// Função para sincronizar modo demo com Supabase (copiar lista local para nuvem)
window.sincronizarComNuvem = async function() {
    if (modoDemo) {
        if (confirm('Deseja fazer login para salvar sua lista na nuvem?')) {
            // Salva os itens atuais antes de redirecionar
            const itensDemo = getItensDemo()
            localStorage.setItem('lista_para_sincronizar', JSON.stringify(itensDemo))
            window.location.href = 'login.html?sync=true'
        }
    }
}

// Atualiza o indicador visual do modo atual
function atualizarStatusModo(tipo) {
    if (statusModo) {
        if (tipo === 'demo') {
            statusModo.innerHTML = '🎮 Modo Demo (Offline) - <button onclick="sincronizarComNuvem()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">💾 Salvar na Nuvem</button>'
            statusModo.style.background = '#fff3cd'
            statusModo.style.color = '#856404'
        } else {
            statusModo.innerHTML = '☁️ Modo Online (Conectado) - Dados salvos na nuvem'
            statusModo.style.background = '#d4edda'
            statusModo.style.color = '#155724'
        }
    }
    
    if (btnModoDemo) {
        if (tipo === 'demo') {
            btnModoDemo.textContent = '🎮 Modo Demo Ativo'
            btnModoDemo.disabled = true
            btnModoDemo.style.opacity = '0.6'
        } else {
            btnModoDemo.textContent = '📱 Usar sem Login (Modo Demo)'
            btnModoDemo.disabled = false
            btnModoDemo.style.opacity = '1'
        }
    }
}

// Verificar se há sincronização pendente ao carregar a página
async function verificarSincronizacaoPendente() {
    const itensParaSincronizar = localStorage.getItem('lista_para_sincronizar')
    if (itensParaSincronizar && !modoDemo) {
        const itens = JSON.parse(itensParaSincronizar)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user && itens.length > 0) {
            if (confirm(`Você tem ${itens.length} itens no modo demo. Deseja sincronizá-los com a nuvem?`)) {
                for (const item of itens) {
                    await supabase.from('lista_compras').insert({
                        item: item.item,
                        adicionado_por: user.id,
                        concluido: item.concluido,
                        data_criacao: item.data_criacao
                    })
                }
                localStorage.removeItem('lista_para_sincronizar')
                alert('Itens sincronizados com sucesso!')
                carregarLista()
            }
        }
    }
}

// Inicialização
async function init() {
    const isDemo = await verificarModoDemo()
    
    if (!isDemo) {
        // Tenta pegar o usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user && !modoDemo) {
            // Se não tem usuário e não está em modo demo, mostra opção
            if (confirm('Deseja usar o aplicativo sem fazer login? (Modo Demo)')) {
                ativarModoDemo()
            } else {
                window.location.href = 'login.html'
                return
            }
        } else if (user) {
            modoDemo = false
            usuarioAtual = user
        }
    }
    
    await carregarLista()
    await verificarSincronizacaoPendente()
}

// Evento para tecla Enter
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && document.activeElement === input) {
        adicionarItem()
    }
})

// Inicia o app
init()