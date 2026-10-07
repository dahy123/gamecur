import { lazy, Suspense, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const AdminPage = lazy(() => import('./pages/Admin.jsx'))

const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? (globalThis.__gamecurSupabase ??= createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ))
    : null

const normalizeKey = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')

const initialForm = {
  nom: '',
  prenom: '',
  telephone: '',
  filiere: '',
  interet: 'oui',
  equipment: {
    smartphonetablette: false,
    pcportablepersonnel: false,
    pcfixecybercafesalledesjeux: false,
    consoleplaystationxbox: false,
  },
  jeux: {
    easportsfcefootballpes: false,
    pubgmobilefreefire: false,
    callofdutymobile: false,
    valorantcs2: false,
    mobilelegendsleagueoflegends: false,
    tekken8streetfighter6: false,
    autre: '',
  },
  format: '',
  budget: '',
  recompense: '',
  disponibilite: '',
  nonParticipation: {
    jenepasajoauxjeux: false,
    jenaiapasdedisponibilite: false,
    leprixdeparticipationesttropeleve: false,
    jenaiaspasdematerieldejeu: false,
    autre: '',
  },
  remarque: '',
}

function SurveyPage() {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setSubmitStatus((status) =>
      status.type === 'error' ? { type: '', message: '' } : status,
    )

    if (name.includes('.')) {
      const [group, field] = name.split('.')
      setForm((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: type === 'checkbox' ? checked : value,
        },
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const radioOptions = [
    { value: 'oui', label: 'Oui, je suis intéressé(e)' },
    { value: 'non', label: 'Non, je ne souhaite pas participer' },
  ]

  const equipmentOptions = [
    'Smartphone / Tablette',
    'PC portable (personnel)',
    'PC fixe (Cybercafé / Salle de jeux)',
    'Console (PlayStation, Xbox)',
  ]

  const jeuxOptions = [
    'EA Sports FC / eFootball (PES)',
    'PUBG Mobile / Free Fire',
    'Call of Duty: Mobile',
    'Valorant / CS2',
    'Mobile Legends / League of Legends',
    'Tekken 8 / Street Fighter 6',
  ]

  const budgetOptions = [
    '3 000 Ar',
    'Entre 5 000 Ar et 10 000 Ar',
    'Entre 10 000 Ar et 15 000 Ar',
    'Plus de 15 000 Ar',
  ]

  const rewardOptions = [
    'Vola en espèces (Cash prize)',
    'Des forfaits internet / crédits de communication',
    'Du matériel (écouteurs, manettes, goodies)',
  ]

  const availabilityOptions = [
    'Jeudi après-midi',
    'Vendredi après-midi',
    'Samedi (journée)',
    'Dimanche (journée)',
  ]

  const noParticipationReasons = [
    'Je ne joue pas à des jeux',
    'Je n’ai pas de disponibilité',
    'Le prix de participation est trop élevé',
    'Je n’ai pas de matériel de jeu',
  ]

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!supabase) {
      setSubmitStatus({
        type: 'error',
        message: 'Configuration Supabase introuvable. Vérifiez votre fichier .env.local.',
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: '', message: '' })

    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        filiere: form.filiere,
        interet: form.interet,
        equipment: form.equipment,
        jeux: form.jeux,
        format: form.format,
        budget: form.budget,
        recompense: form.recompense,
        disponibilite: form.disponibilite,
        non_participation: form.nonParticipation,
        remarque: form.remarque,
      }

      const { error } = await supabase.from('survey_responses').insert([payload])

      if (error) {
        throw error
      }

      setSubmitStatus({
        type: 'success',
        message: 'Votre réponse a bien été enregistrée.',
      })
      setForm(initialForm)
    } catch (error) {
      console.error(error)
      setSubmitStatus({
        type: 'error',
        message:
          'L’envoi a échoué. Vérifiez que la table Supabase survey_responses existe et que les politiques d’accès sont correctes.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <div className="form-wrapper">
        <header className="top-banner">
          <div className="brand-mark px-6">Game CUR</div>
          <div>
            <h1>Tournoi E-sport sur le Campus U.N.A</h1>
            <p className="banner-caption">Votre avis contribue à créer un tournoi qui vous ressemble.</p>
          </div>
        </header>

        <p className="intro-text">
          Merci de prendre 2 minutes pour répondre à cette enquête concernant
          l’organisation d’un tournoi e-sport sur le campus.
        </p>

        {submitStatus.type === 'success' ? (
          <section className="thank-you-card" role="status" aria-live="polite">
            <div className="success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m5 12.5 4.5 4.5L19 7" />
              </svg>
            </div>
            <p className="eyebrow">Réponse bien reçue</p>
            <h2>Merci pour votre participation !</h2>
            <p>{submitStatus.message} Votre contribution nous aide à organiser un tournoi e-sport adapté aux étudiants du campus.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setForm(initialForm)
                setSubmitStatus({ type: '', message: '' })
              }}
            >
              Répondre à une autre enquête
            </button>
          </section>
        ) : (
        <form className="survey-form" onSubmit={handleSubmit}>
          <section className="panel">
            <h2>Section 1 : Informations de contact</h2>

            <div className="grid two-columns">
              <label>
                <span>Nom</span>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleInputChange}
                  placeholder="Votre nom"
                />
              </label>

              <label>
                <span>Prénom</span>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleInputChange}
                  placeholder="Votre prénom"
                />
              </label>
            </div>

            <div className="grid two-columns">
              <label>
                <span>Numéro de téléphone / WhatsApp</span>
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleInputChange}
                  placeholder="+261 ..."
                />
              </label>

              <label>
                <span>Filière et année d’étude</span>
                <input
                  type="text"
                  name="filiere"
                  value={form.filiere}
                  onChange={handleInputChange}
                  placeholder="Ex: Informatique - L2"
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <h2>Question de sélection</h2>
            <div className="selection-box">
              {radioOptions.map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="interet"
                    value={option.value}
                    checked={form.interet === option.value}
                    onChange={handleInputChange}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          {form.interet === 'oui' && (
            <>
              <section className="panel">
                <h2>Section 2 : Détails de participation</h2>

                <div className="question-block">
                  <h3>1. Quel équipement utilisez-vous pour jouer ?</h3>
                  <div className="checkbox-grid">
                    {equipmentOptions.map((item) => {
                      const key = normalizeKey(item)

                      return (
                        <label key={item} className="check-option">
                          <input
                            type="checkbox"
                            name={`equipment.${key}`}
                            checked={form.equipment[key] || false}
                            onChange={handleInputChange}
                          />
                          <span>{item}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="question-block">
                  <h3>2. Quels jeux préférez-vous participer ?</h3>
                  <div className="checkbox-grid">
                    {jeuxOptions.map((item) => {
                      const key = normalizeKey(item)

                      return (
                        <label key={item} className="check-option">
                          <input
                            type="checkbox"
                            name={`jeux.${key}`}
                            checked={form.jeux[key] || false}
                            onChange={handleInputChange}
                          />
                          <span>{item}</span>
                        </label>
                      )
                    })}
                  </div>

                  <label className="inline-field">
                    <span>Autre</span>
                    <input
                      type="text"
                      name="jeux.autre"
                      value={form.jeux.autre}
                      onChange={handleInputChange}
                      placeholder="Précisez un autre jeu"
                    />
                  </label>
                </div>

                <div className="question-block">
                  <h3>3. Compétition souhaitée</h3>
                  <div className="radio-stack">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="format"
                        value="1 contre 1"
                        checked={form.format === '1 contre 1'}
                        onChange={handleInputChange}
                      />
                      <span>1 contre 1</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="format"
                        value="En équipe avec mes amis"
                        checked={form.format === 'En équipe avec mes amis'}
                        onChange={handleInputChange}
                      />
                      <span>En équipe avec mes amis</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="format"
                        value="En équipe aléatoire"
                        checked={form.format === 'En équipe aléatoire'}
                        onChange={handleInputChange}
                      />
                      <span>En équipe aléatoire (Matchmaking sur place)</span>
                    </label>
                  </div>
                </div>

                <div className="question-block">
                  <h3>4. Quel prix de participation accepteriez-vous ?</h3>
                  <div className="radio-stack">
                    {budgetOptions.map((option) => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="budget"
                          value={option}
                          checked={form.budget === option}
                          onChange={handleInputChange}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="question-block">
                  <h3>5. Quelle récompense vous intéresse ?</h3>
                  <div className="radio-stack">
                    {rewardOptions.map((option) => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="recompense"
                          value={option}
                          checked={form.recompense === option}
                          onChange={handleInputChange}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="question-block">
                  <h3>6. À quel moment êtes-vous disponible ?</h3>
                  <div className="radio-stack">
                    {availabilityOptions.map((option) => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="disponibilite"
                          value={option}
                          checked={form.disponibilite === option}
                          onChange={handleInputChange}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {form.interet === 'non' && (
            <section className="panel">
              <h2>Section 3 : Raison de votre choix</h2>

              <div className="question-block">
                <h3>Pourquoi ne souhaitez-vous pas participer ?</h3>
                <div className="checkbox-grid">
                  {noParticipationReasons.map((item) => {
                    const key = normalizeKey(item)

                    return (
                      <label key={item} className="check-option">
                        <input
                          type="checkbox"
                          name={`nonParticipation.${key}`}
                          checked={form.nonParticipation[key] || false}
                          onChange={handleInputChange}
                        />
                        <span>{item}</span>
                      </label>
                    )
                  })}
                </div>

                <label className="inline-field">
                  <span>Autre</span>
                  <input
                    type="text"
                    name="nonParticipation.autre"
                    value={form.nonParticipation.autre}
                    onChange={handleInputChange}
                    placeholder="Précisez votre raison"
                  />
                </label>
              </div>
            </section>
          )}

          <section className="panel footer-panel">
            <label className="inline-field textarea-field">
              <span>Commentaires ou remarque</span>
              <textarea
                name="remarque"
                value={form.remarque}
                onChange={handleInputChange}
                rows="4"
                placeholder="Ajouter un commentaire ou une suggestion..."
              />
            </label>

            {submitStatus.type === 'error' && (
              <div className="submit-status error" role="alert">
                {submitStatus.message}
              </div>
            )}

            <div className="submit-row">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre le formulaire'}
              </button>
            </div>
          </section>
        </form>
        )}
      </div>
    </main>
  )
}

export default function App() {
  const routePath =
    new URLSearchParams(window.location.search).get('page') ||
    window.location.pathname.replace(import.meta.env.BASE_URL, '').replace(/^\/+|\/+$/g, '')

  if (routePath !== 'admin') {
    return <SurveyPage />
  }

  return (
    <Suspense fallback={<main className="app-shell">Chargement de la page admin…</main>}>
      <AdminPage />
    </Suspense>
  )
}
