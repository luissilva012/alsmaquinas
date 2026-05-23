(() => {
  // Orcamento - storage e configuracao
  const STORAGE_KEY = 'als_quote_items';
  const WHATSAPP_NUMBER = '5516991265833';

  // Orcamento - leitura e escrita da lista
  const read = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  };

  const write = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('als:quote-updated', { detail: items }));
  };

  // Orcamento - operacoes do carrinho
  const getItems = () => read();
  const getMachineImage = (machine) => machine.mainImageUrl || machine.image || '';
  const getMachineStatusLabel = (machine) =>
    machine.statusLabel || machine.commercialStatus || machine.status || 'Sob consulta';

  const addItem = (machine) => {
    const items = read();
    const existing = items.find((item) => item.id === machine.id);

    if (existing) {
      existing.quantity += 1;
      write(items);
      return;
    }

    write([
      ...items,
      {
        id: machine.id,
        name: machine.name,
        category: machine.category,
        slug: machine.slug,
        image: getMachineImage(machine),
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id) => {
    write(read().filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    write(
      read().map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const clear = () => write([]);

  // Orcamento - envio para WhatsApp
  const buildMessage = () => {
    const items = read();
    const lines = [
      'Ol&aacute;, vim pelo site da ALS M&aacute;quinas e gostaria de solicitar um or&ccedil;amento para os seguintes equipamentos:',
      '',
    ];

    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${decodeHtml(item.name)}`);
      lines.push(`Categoria: ${decodeHtml(item.category)}`);
      lines.push(`Quantidade: ${item.quantity}`);
      lines.push('');
    });

    lines.push('Aguardo retorno.');
    return decodeHtml(lines.join('\n'));
  };

  const openWhatsApp = () => {
    const message = buildMessage();
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener',
    );
  };

  const openAvailability = (machine) => {
    const message = decodeHtml([
      'Ol&aacute;, vim pelo site da ALS M&aacute;quinas e gostaria de consultar a disponibilidade deste equipamento:',
      '',
      machine.name,
      `Categoria: ${machine.category}`,
      `Status atual: ${getMachineStatusLabel(machine)}`,
      '',
      'Aguardo retorno.',
    ].join('\n'));

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener',
    );
  };

  // Orcamento - helpers
  const decodeHtml = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
  };

  window.ALSQuoteList = {
    getItems,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    openWhatsApp,
    openAvailability,
  };
})();
