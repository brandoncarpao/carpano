const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      navbar.classList.add('visible');
    } else {
      navbar.classList.remove('visible');
    }
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  // Mantener seis productos aleatorios en «Para mí» y trasladar
  // el resto a la colección visible «Más ideas para regalar».
  {
    const section = document.querySelector('#sub-mimimo')?.closest('.product-subsection');
    const giftGrid = section?.querySelector('.products-grid');
    const moreGiftGrid = document.getElementById('more-gift-products');
    if (giftGrid && moreGiftGrid) {
      const products = Array.from(giftGrid.querySelectorAll(':scope > .gift-product'));
      for (let i = products.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [products[i], products[j]] = [products[j], products[i]];
      }
      products.forEach((product, index) => {
        if (index < 6) {
          product.style.removeProperty('display');
          product.removeAttribute('aria-hidden');
          giftGrid.appendChild(product);
        } else {
          product.classList.add('is-archived');
          product.removeAttribute('aria-hidden');
          moreGiftGrid.appendChild(product);
        }
      });
    }
  }

  // Frases variadas en las tarjetas de la colección «Para mí».
  {
    const giftPhrases = ["Una joya para ti","Tu próximo favorito","Un brillo muy tuyo","Pequeños detalles, gran estilo","Elige algo especial","Tu momento de brillar","Un toque de elegancia","Descubre tu sorpresa","Hay algo para ti","Un detalle con encanto","Hazlo parte de tu estilo","Un capricho bonito","Encuentra tu favorito","Un brillo que te acompaña","Algo especial te espera"];
    document.querySelectorAll('.gift-cover .gift-message').forEach((message, index) => {
      message.textContent = giftPhrases[index % giftPhrases.length];
    });
  }

  document.querySelectorAll('.gift-cover').forEach(button => {
    button.addEventListener('click', () => {
      const gift = button.closest('.gift-product');
      if (!gift) return;
      gift.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      const card = gift.querySelector('.product-card');
      if (card) card.classList.add('visible');
    });
  });


  // Diez ondas doradas en la portada: parallax suave al desplazarse y movimiento continuo.
  {
    const hero = document.querySelector('.hero');
    if (!hero) { console.warn('No se encontró la portada para las ondas de Carpaño.'); }
    const waveSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    waveSvg.setAttribute('class', 'carpano-cursor-waves');
    waveSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    waveSvg.setAttribute('preserveAspectRatio', 'none');
    waveSvg.setAttribute('aria-hidden', 'true');
    waveSvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:1;display:block;overflow:hidden;';
    const wavePaths = [];
    const waveOpacities = [0.14, 0.18, 0.22, 0.27, 0.32, 0.40, 0.32, 0.27, 0.22, 0.16];
    for (let i = 0; i < 10; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#C5A059');
      path.setAttribute('stroke-width', i === 5 ? '1.5' : '1.1');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.style.opacity = waveOpacities[i];
      waveSvg.appendChild(path);
      wavePaths.push(path);
    }
    hero.appendChild(waveSvg);

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let smoothX = targetX;
    let smoothY = targetY;
    let phase = 0;
    let lastTime = 0;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const updateParallax = () => {
      // La portada conserva las ondas dentro de sus límites; solo compensan un poco el scroll.
      const rect = hero.getBoundingClientRect();
      const offset = Math.max(-36, Math.min(36, -rect.top * 0.07));
      waveSvg.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const drawWaves = (time = 0) => {
      const width = hero.clientWidth || window.innerWidth;
      const height = hero.clientHeight || window.innerHeight;
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      if (!reduceMotion) phase += delta * 0.42;
      smoothX += (targetX - smoothX) * 0.045;
      smoothY += (targetY - smoothY) * 0.045;
      waveSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

      wavePaths.forEach((path, index) => {
        const layer = index - 4.5;
        const baseY = height * 0.5 + layer * 25;
        const amplitude = 142 + Math.abs(layer) * 9;
        const wavelength = 0.0035 + index * 0.00008;
        const cursorOffsetX = finePointer ? (smoothX - window.innerWidth * 0.5) * 0.055 : 0;
        const cursorOffsetY = finePointer ? (smoothY - window.innerHeight * 0.5) * 0.075 : 0;
        const points = [];
        for (let x = -30; x <= width + 30; x += 18) {
          const relativeX = x - width * 0.5 - cursorOffsetX;
          const direction = index % 2 ? -1 : 1;
          const drift = Math.sin(relativeX * 0.0015 + phase * 0.55 + layer * 0.45) * 13;
          const swell = Math.sin(relativeX * wavelength + phase * direction + layer * 0.31 + Math.sin(relativeX * 0.00115 + phase * 0.34 + index * 0.37) * 0.72);
          const secondary = Math.sin(relativeX * (wavelength * 1.73) - phase * 0.58 + index * 0.91) * 0.22;
          const y = baseY + cursorOffsetY + swell * amplitude * 0.78 + secondary * amplitude + drift;
          points.push([x, y]);
        }
        let d = `M ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i][0] + points[i + 1][0]) / 2;
          const midY = (points[i][1] + points[i + 1][1]) / 2;
          d += ` Q ${points[i][0]} ${points[i][1]} ${midX} ${midY}`;
        }
        const last = points[points.length - 1];
        d += ` T ${last[0]} ${last[1]}`;
        path.setAttribute('d', d);
      });
      if (!reduceMotion) window.requestAnimationFrame(drawWaves);
    };

    if (finePointer) {
      window.addEventListener('pointermove', event => {
        targetX = event.clientX;
        targetY = event.clientY;
      }, { passive: true });
    }
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', () => {
      targetX = Math.min(targetX, window.innerWidth);
      targetY = Math.min(targetY, window.innerHeight);
      updateParallax();
    }, { passive: true });
    updateParallax();
    drawWaves();
  }
