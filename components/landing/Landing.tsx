'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { getPlano } from '@/lib/plano'
import { between, today } from '@/lib/date'

// ── Conteúdo real do projeto (lib/plano139.json) ───────────────────────────────

const FASES = [
  { n: '01', nome: 'Fundação', desc: 'Teoria bloco a bloco. A base é construída sob pressão controlada.' },
  { n: '02', nome: 'Aprofundamento', desc: 'Segunda passada de teoria e questões. O conhecimento vira reflexo.' },
  { n: '03', nome: 'Consolidação', desc: 'Questões intensivas, simulados e revisões. Pronto para o confronto.' },
]

const SISTEMA = [
  { t: 'Cronograma diário', d: 'Cada dia tem seus blocos definidos. Marcar feito alimenta todo o painel — sem decisão, sem desculpa.' },
  { t: 'Registro de sessões', d: 'Tempo estudado, questões resolvidas, acertos e observações. Tudo registrado, nada esquecido.' },
  { t: 'Revisões automáticas', d: 'Errou uma questão? Revisão agendada em 7 dias. Acertou menos de 75%? Revisão automática. Recorrência até dominar.' },
  { t: 'Readiness Score', d: 'Cinco dimensões — edital, acertos, revisões, frequência e simulados — em um único número: o quão pronto você está.' },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null)

  const plano = getPlano()
  const diasProva = Math.max(0, between(today(), plano.meta.prova))
  const totalBlocos = plano.cronograma.filter(b => b.tipo !== 'Descanso').length
  const classeA = plano.disciplinas.filter(d => d.classe === 'A')
  const classeB = plano.disciplinas.filter(d => d.classe === 'B')
  const classeC = plano.disciplinas.filter(d => d.classe === 'C')

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // ── HERO: pin + zoom cinematográfico ────────────────────────────────
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-hero]',
          start: 'top top',
          end: '+=180%',
          scrub: 0.6,
          pin: true,
        },
      })
      heroTl
        .fromTo('[data-hero-img]', { scale: 1.35, yPercent: -6 }, { scale: 1.02, yPercent: 0, ease: 'none' }, 0)
        .fromTo('[data-hero-beam]', { xPercent: -130, opacity: 0 }, { xPercent: 130, opacity: 0.55, ease: 'none' }, 0)
        .to('[data-hero-title]', { letterSpacing: '0.35em', opacity: 0.15, ease: 'none' }, 0.45)
        .to('[data-hero-sub]', { opacity: 0, y: -30, ease: 'none' }, 0.4)
        .to('[data-hero-img]', { filter: 'brightness(0.25) saturate(0.6)', ease: 'none' }, 0.55)
        .fromTo('[data-hero-call]', { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: 'none' }, 0.7)

      // ── Reveals genéricos ───────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => {
        gsap.from(el, {
          y: 70,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
        })
      })

      // ── Contadores ──────────────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach(el => {
        const target = Number(el.dataset.count)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          onUpdate: () => { el.textContent = String(Math.round(obj.v)) },
        })
      })

      // ── Fases: linha de progresso ───────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-fase-bar]').forEach(el => {
        gsap.fromTo(el, { scaleX: 0 }, {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 1.4,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
        })
      })

      // ── Disciplinas: stagger ────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-disc-group]').forEach(group => {
        gsap.from(group.querySelectorAll('[data-disc]'), {
          x: -40,
          opacity: 0,
          stagger: 0.07,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: group, start: 'top 80%', toggleActions: 'play none none reverse' },
        })
      })

      // ── CTA final: zoom lento na imagem ─────────────────────────────────
      gsap.fromTo('[data-cta-img]', { scale: 1.25 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: '[data-cta]', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
    }, rootRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={rootRef} className="bg-black text-neutral-100 overflow-x-hidden antialiased">
      <style>{`
        @keyframes smokeDrift {
          0% { transform: translate3d(-8%, 0, 0) scale(1); opacity: .35; }
          50% { transform: translate3d(6%, -4%, 0) scale(1.15); opacity: .5; }
          100% { transform: translate3d(-8%, 0, 0) scale(1); opacity: .35; }
        }
        @keyframes pulseRed { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        .grain::after {
          content: ''; position: absolute; inset: -50%; pointer-events: none; opacity: .09;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: smokeDrift 14s ease-in-out infinite;
        }
        .display { font-weight: 900; text-transform: uppercase; line-height: .92; }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section data-hero className="relative h-screen overflow-hidden">
        <div data-hero-img className="absolute inset-0 will-change-transform">
          <Image
            src="/landing-hero.png"
            alt="Operadores táticos em treinamento noturno"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[38%_20%]"
          />
        </div>

        {/* Vinheta noir + esmagamento de cor */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,.88)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
        <div className="absolute inset-0 bg-red-950/15 mix-blend-multiply" />

        {/* Feixe de luz vermelho varrendo */}
        <div
          data-hero-beam
          className="absolute inset-y-0 left-1/4 w-40 rotate-12 bg-gradient-to-r from-transparent via-red-600/40 to-transparent blur-2xl will-change-transform"
        />

        {/* Fumaça rasteira */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-[radial-gradient(ellipse_at_bottom,rgba(120,120,130,.28),transparent_70%)] blur-xl" style={{ animation: 'smokeDrift 11s ease-in-out infinite' }} />

        <div className="grain absolute inset-0" />

        {/* Título */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p data-hero-sub className="mb-4 text-xs font-semibold tracking-[0.45em] text-red-500 uppercase" style={{ animation: 'pulseRed 3s ease-in-out infinite' }}>
            Polícia Civil da Bahia · Investigador
          </p>
          <h1 data-hero-title className="display text-[clamp(4.5rem,18vw,14rem)] tracking-[0.08em] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,.9)]">
            ORDO
          </h1>
          <p data-hero-sub className="mt-4 max-w-xl text-sm sm:text-base text-neutral-300 font-medium tracking-wide">
            Centro de Comando da Aprovação
          </p>

          {/* Chamada revelada no fim do pin */}
          <div data-hero-call className="absolute bottom-20 inset-x-0 px-6 opacity-0">
            <p className="display text-2xl sm:text-4xl text-white">
              A prova é em <span className="text-red-500">{diasProva} dias</span>.
            </p>
            <p className="mt-2 text-sm text-neutral-400">Role para conhecer o plano de batalha.</p>
          </div>
        </div>

        {/* Indicador de rolagem */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-neutral-500">
          <div className="mx-auto h-10 w-px bg-gradient-to-b from-transparent via-red-600 to-transparent" />
        </div>
      </section>

      {/* ═══ O PLANO (números reais) ═══ */}
      <section id="plano" className="relative mx-auto max-w-5xl px-6 py-32 sm:py-44">
        <p data-reveal className="text-xs font-semibold tracking-[0.4em] text-red-500 uppercase mb-4">Preparação</p>
        <h2 data-reveal className="display text-4xl sm:text-6xl text-white mb-6">
          Um plano de batalha.<br />Nenhuma improvisação.
        </h2>
        <p data-reveal className="max-w-2xl text-neutral-400 leading-relaxed mb-16">
          De {plano.meta.inicio.split('-').reverse().join('/')} até {plano.meta.fimPlano.split('-').reverse().join('/')},
          cada dia tem blocos de 50 minutos definidos — teoria, questões, revisões e simulados.
          Depois, 7 dias de buffer até a prova em {plano.meta.prova.split('-').reverse().join('/')}.
        </p>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { v: plano.meta.totalDias, l: 'dias de estudo' },
            { v: plano.meta.semanas, l: 'semanas' },
            { v: totalBlocos, l: 'blocos de combate' },
            { v: plano.meta.metaSemanalHoras, l: 'horas por semana' },
          ].map(s => (
            <div key={s.l} data-reveal className="border-l-2 border-red-700/60 pl-4">
              <p className="display text-5xl sm:text-6xl text-white tabular-nums">
                <span data-count={s.v}>0</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FASES ═══ */}
      <section className="relative border-y border-neutral-900 bg-neutral-950/60 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p data-reveal className="text-xs font-semibold tracking-[0.4em] text-red-500 uppercase mb-4">Progressão</p>
          <h2 data-reveal className="display text-4xl sm:text-6xl text-white mb-16">Três fases. Uma direção.</h2>

          <div className="space-y-14">
            {FASES.map(f => (
              <div key={f.n} data-reveal>
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="display text-red-600 text-xl">{f.n}</span>
                  <h3 className="display text-2xl sm:text-3xl text-white">{f.nome}</h3>
                </div>
                <p className="text-neutral-400 max-w-xl mb-4">{f.desc}</p>
                <div data-fase-bar className="h-px bg-gradient-to-r from-red-700 via-red-900 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ARSENAL / DISCIPLINAS ═══ */}
      <section className="mx-auto max-w-5xl px-6 py-32 sm:py-44">
        <p data-reveal className="text-xs font-semibold tracking-[0.4em] text-red-500 uppercase mb-4">Arsenal</p>
        <h2 data-reveal className="display text-4xl sm:text-6xl text-white mb-6">14 disciplinas.<br />Prioridade calculada.</h2>
        <p data-reveal className="max-w-2xl text-neutral-400 leading-relaxed mb-16">
          O edital inteiro, dividido em classes por peso e frequência. Classe A recebe o grosso da carga horária — onde a prova decide.
        </p>

        <div className="grid gap-12 md:grid-cols-3">
          {[
            { label: 'Classe A', sub: 'maior peso e frequência', discs: classeA, accent: 'text-red-500 border-red-800' },
            { label: 'Classe B', sub: 'peso médio', discs: classeB, accent: 'text-neutral-300 border-neutral-700' },
            { label: 'Classe C', sub: 'peso menor', discs: classeC, accent: 'text-neutral-500 border-neutral-800' },
          ].map(g => (
            <div key={g.label} data-disc-group>
              <div className={`border-b pb-2 mb-4 ${g.accent}`}>
                <p className="display text-xl">{g.label}</p>
                <p className="text-[11px] uppercase tracking-widest text-neutral-600">{g.sub}</p>
              </div>
              <ul className="space-y-2.5">
                {g.discs.map(d => (
                  <li key={d.disciplina} data-disc className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-neutral-300">{d.disciplina}</span>
                    <span className="shrink-0 font-mono text-xs text-neutral-600">{d.horasPlanejadas}h</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SISTEMA ═══ */}
      <section className="relative border-y border-neutral-900 bg-neutral-950/60 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p data-reveal className="text-xs font-semibold tracking-[0.4em] text-red-500 uppercase mb-4">Treinamento</p>
          <h2 data-reveal className="display text-4xl sm:text-6xl text-white mb-16">
            O sistema não deixa<br />você se enganar.
          </h2>

          <div className="grid gap-10 sm:grid-cols-2">
            {SISTEMA.map(s => (
              <div key={s.t} data-reveal className="border border-neutral-900 bg-black/50 p-7 hover:border-red-900/60 transition-colors">
                <h3 className="display text-lg text-white mb-3">{s.t}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section data-cta className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div data-cta-img className="absolute inset-0 will-change-transform">
          <Image
            src="/landing-hero.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[60%_35%] brightness-[0.3] saturate-50"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,.92)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="grain absolute inset-0" />

        <div className="relative z-10 px-6 text-center">
          <p data-reveal className="text-xs font-semibold tracking-[0.4em] text-red-500 uppercase mb-6">Recrutamento</p>
          <h2 data-reveal className="display text-5xl sm:text-8xl text-white mb-6">
            O edital<br />não espera.
          </h2>
          <p data-reveal className="mx-auto max-w-md text-neutral-400 mb-12">
            {diasProva} dias até a prova. Cada bloco não estudado é um ponto entregue ao concorrente.
          </p>
          <div data-reveal>
            <Link
              href="/login"
              className="display inline-block border-2 border-red-600 bg-red-600/10 px-10 py-5 text-sm tracking-[0.25em] text-white backdrop-blur-sm transition-all hover:bg-red-600 hover:shadow-[0_0_60px_rgba(220,38,38,.45)]"
            >
              Entrar no centro de comando
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Rodapé ═══ */}
      <footer className="border-t border-neutral-900 py-10 text-center">
        <p className="display text-sm text-neutral-600 tracking-[0.3em]">ORDO</p>
        <p className="mt-1 text-[11px] text-neutral-700">Plataforma de estudos · Investigador PC-BA</p>
      </footer>
    </div>
  )
}
