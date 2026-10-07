import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? (globalThis.__gamecurSupabase ??= createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ))
    : null

const PAGE_SIZE = 20
const equipmentLabels = {
  smartphonetablette: 'Smartphone / Tablette',
  pcportablepersonnel: 'PC portable personnel',
  pcfixecybercafesalledesjeux: 'PC fixe / Cybercafé',
  consoleplaystationxbox: 'Console',
}
const gameLabels = {
  easportsfcefootballpes: 'EA Sports FC / eFootball',
  pubgmobilefreefire: 'PUBG Mobile / Free Fire',
  callofdutymobile: 'Call of Duty: Mobile',
  valorantcs2: 'Valorant / CS2',
  mobilelegendsleagueoflegends: 'Mobile Legends / League of Legends',
  tekken8streetfighter6: 'Tekken 8 / Street Fighter 6',
}
const reasonLabels = {
  jenepasjouepasadesjeux: 'Ne joue pas aux jeux',
  jenaiapasdedisponibilite: 'Pas disponible',
  leprixdeparticipationesttropeleve: 'Prix trop élevé',
  jenaiapasdematerieldejeu: 'Pas de matériel',
}

const selectedLabels = (values, labels) => {
  if (!values || typeof values !== 'object') return '—'
  const selected = Object.entries(labels)
    .filter(([key]) => values[key])
    .map(([, label]) => label)
  if (values.autre) selected.push(`Autre : ${values.autre}`)
  return selected.join(', ') || '—'
}

const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(date))
    : '—'

const exportRows = (responses) =>
  responses.map((response) => ({
    Date: dateLabel(response.created_at),
    Nom: response.nom || '',
    Prénom: response.prenom || '',
    Téléphone: response.telephone || '',
    'Filière / année': response.filiere || '',
    Intéressé: response.interet === 'oui' ? 'Oui' : 'Non',
    Équipement: selectedLabels(response.equipment, equipmentLabels),
    Jeux: selectedLabels(response.jeux, gameLabels),
    Format: response.format || '',
    Budget: response.budget || '',
    Récompense: response.recompense || '',
    Disponibilité: response.disponibilite || '',
    'Motifs de non-participation': selectedLabels(
      response.non_participation,
      reasonLabels,
    ),
    Commentaire: response.remarque || '',
  }))

export default function AdminPage() {
  const [responses, setResponses] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [refreshToken, setRefreshToken] = useState(0)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [isExporting, setIsExporting] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [errorMessage, setErrorMessage] = useState(
    supabase ? '' : 'Configuration Supabase introuvable. Vérifiez .env.local.',
  )

  useEffect(() => {
    if (!supabase) return undefined

    let isCurrentRequest = true

    const fetchResponses = async () => {
      try {
        const from = page * PAGE_SIZE
        const { data, count, error } = await supabase
          .from('survey_responses')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)

        if (!isCurrentRequest) return
        if (error) {
          console.error(error)
          setErrorMessage(
            'Impossible de charger les réponses. Vérifiez que la politique de lecture publique est appliquée dans Supabase.',
          )
        } else {
          setResponses(data || [])
          setTotalCount(count || 0)
          setErrorMessage('')
        }
      } catch (error) {
        if (!isCurrentRequest) return
        console.error(error)
        setErrorMessage('Impossible de joindre Supabase. Vérifiez votre connexion puis réessayez.')
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    fetchResponses()
    return () => {
      isCurrentRequest = false
    }
  }, [page, refreshToken])

  const getAllResponses = async () => {
    const allResponses = []
    let from = 0
    const batchSize = 1000

    while (from < totalCount) {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1)

      if (error) throw error
      allResponses.push(...(data || []))
      if (!data || data.length < batchSize) break
      from += batchSize
    }

    return allResponses
  }

  const handleExport = async (format) => {
    setIsExporting(true)
    setErrorMessage('')

    try {
      const rows = exportRows(await getAllResponses())
      if (format === 'xlsx') {
        const { default: writeExcelFile } = await import('write-excel-file/browser')
        const headers = Object.keys(rows[0] || {
          Information: 'Aucune soumission enregistrée',
        })
        const sheetData = [
          headers,
          ...rows.map((row) => headers.map((header) => row[header] || '')),
        ]
        await writeExcelFile(sheetData).toFile('game-cur-reponses-enquete.xlsx')
      } else {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ])
        const document = new jsPDF({ orientation: 'landscape', unit: 'mm' })
        document.setFontSize(16)
        document.text('Game CUR — Réponses à l’enquête e-sport', 14, 16)
        document.setFontSize(9)
        document.text(`${rows.length} réponse(s)`, 14, 22)
        autoTable(document, {
          startY: 28,
          head: [Object.keys(rows[0] || { Information: 'Aucune réponse' })],
          body: rows.length
            ? rows.map((row) => Object.values(row).map((value) => String(value)))
            : [['Aucune réponse enregistrée']],
          styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [185, 20, 20] },
          margin: { left: 10, right: 10 },
        })
        document.save('game-cur-reponses-enquete.pdf')
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('L’export a échoué. Veuillez réessayer.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (response) => {
    const respondent = [response.nom, response.prenom].filter(Boolean).join(' ') || 'cette réponse'
    const confirmed = window.confirm(
      `Supprimer définitivement la soumission de ${respondent} ? Cette action est irréversible.`,
    )
    if (!confirmed) return

    setDeletingId(response.id)
    setErrorMessage('')

    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('id', response.id)
        .select('id')

      if (error) throw error
      if (!data?.length) {
        throw new Error('Aucune ligne supprimée. Vérifiez les droits de suppression Supabase.')
      }

      setResponses((current) => current.filter((item) => item.id !== response.id))
      setTotalCount((current) => Math.max(0, current - 1))
      if (responses.length === 1 && page > 0) setPage((current) => current - 1)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        'La suppression a échoué. Vérifiez que la politique de suppression publique est activée dans Supabase.',
      )
    } finally {
      setDeletingId('')
    }
  }

  const filteredResponses = responses.filter((response) =>
    [
      response.nom,
      response.prenom,
      response.telephone,
      response.filiere,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase())),
  )
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <main className="app-shell admin-shell">
      <div className="admin-wrapper">
        <header className="admin-header">
          <a
            className="brand-mark admin-brand px-3"
            href={import.meta.env.BASE_URL}
            aria-label="Retour au formulaire Game CUR"
          >
            Game CUR
          </a>
          <div className="admin-heading">
            <p className="eyebrow">Espace administration</p>
            <h1>Réponses à l’enquête</h1>
            <p>Consultez les soumissions et exportez les résultats.</p>
          </div>
          <a className="secondary-button admin-back-link" href={import.meta.env.BASE_URL}>
            Retour au formulaire
          </a>
        </header>

        <section className="admin-content">
          <div className="public-access-notice" role="note">
            Cette page et les données affichées sont publiques et accessibles sans connexion.
          </div>

          <div className="admin-toolbar">
            <div className="response-count">
              <strong>{totalCount}</strong>
              <span>{totalCount === 1 ? 'soumission' : 'soumissions'}</span>
            </div>
            <label className="admin-search">
              <span className="sr-only">Rechercher sur cette page</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher dans cette page…"
              />
            </label>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setRefreshToken((current) => current + 1)
              }}
              disabled={isLoading || !supabase}
            >
              {isLoading ? 'Actualisation…' : 'Actualiser'}
            </button>
            <button
              className="export-button"
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting || totalCount === 0}
            >
              {isExporting ? 'Préparation…' : 'Exporter Excel'}
            </button>
            <button
              className="export-button export-button-light"
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || totalCount === 0}
            >
              Exporter PDF
            </button>
          </div>

          {errorMessage && (
            <div className="submit-status error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="table-frame">
            <table className="responses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom / prénom</th>
                  <th>Téléphone</th>
                  <th>Filière</th>
                  <th>Participation</th>
                  <th>Équipement</th>
                  <th>Jeux</th>
                  <th>Format</th>
                  <th>Budget</th>
                  <th>Disponibilité</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="table-empty" colSpan="11">Chargement des réponses…</td>
                  </tr>
                ) : filteredResponses.length ? (
                  filteredResponses.map((response) => (
                    <tr key={response.id}>
                      <td>{dateLabel(response.created_at)}</td>
                      <td className="respondent-name">
                        {[response.nom, response.prenom].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td>{response.telephone || '—'}</td>
                      <td>{response.filiere || '—'}</td>
                      <td>
                        <span className={`answer-pill ${response.interet === 'oui' ? 'answer-yes' : 'answer-no'}`}>
                          {response.interet === 'oui' ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td>{selectedLabels(response.equipment, equipmentLabels)}</td>
                      <td>{selectedLabels(response.jeux, gameLabels)}</td>
                      <td>{response.format || '—'}</td>
                      <td>{response.budget || '—'}</td>
                      <td>{response.disponibilite || '—'}</td>
                      <td>
                        <button
                          className="delete-row-button"
                          type="button"
                          onClick={() => handleDelete(response)}
                          disabled={Boolean(deletingId) || isLoading}
                          aria-label={`Supprimer la soumission de ${[response.nom, response.prenom].filter(Boolean).join(' ') || 'cet étudiant'}`}
                        >
                          {deletingId === response.id ? 'Suppression…' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="table-empty" colSpan="11">
                      {responses.length ? 'Aucun résultat sur cette page.' : 'Aucune soumission pour le moment.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="admin-pagination">
            <span>
              Page {page + 1} sur {pageCount}
            </span>
            <div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  setPage((current) => Math.max(0, current - 1))
                }}
                disabled={page === 0 || isLoading}
              >
                Précédent
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }}
                disabled={page >= pageCount - 1 || isLoading}
              >
                Suivant
              </button>
            </div>
          </footer>
          <p className="admin-search-hint">La recherche porte sur les résultats de la page affichée. Les exports incluent toutes les soumissions.</p>
        </section>
      </div>
    </main>
  )
}
