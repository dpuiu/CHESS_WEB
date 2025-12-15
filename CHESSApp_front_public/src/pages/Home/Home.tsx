import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import CardGrid from './components/CardGrid/CardGrid';
import browser_penguin from "../../assets/images/icon.browser.round.png";
import download_penguin from '../../assets/images/icon.download.round.png';
import search_penguin from '../../assets/images/icon.search.round.png';

const cards = [
  {
    link: 'browser',
    title: 'Genome Browser',
    imageSrc: browser_penguin,
    description: 'Explore the genomes and annotations included in the CHESS database.'
  },
  {
    link: 'downloads',
    title: 'Download Curated Files',
    imageSrc: download_penguin,
    description: 'Download curated files from the CHESS database.'
  },
  {
    link: 'explore',
    title: 'Explore',
    imageSrc: search_penguin,
    description: 'Explore genes and transcripts in the CHESS database.'
  }
];

const Home: React.FC = () => {
  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="text-center mb-4">Welcome to CHESS</h1>
          <p className="text-center mb-5">
            A unified resource for downloading and customizing genome annotations.
          </p>
        </Col>
      </Row>
      <CardGrid cards={cards} />
    </Container>
  );
};

export default Home;
