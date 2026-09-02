import styles from './ArticleBody.module.css'

export default function ArticleBody({ content }: { content: string }) {
  return (
    <article 
      className={styles.articleBody}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
