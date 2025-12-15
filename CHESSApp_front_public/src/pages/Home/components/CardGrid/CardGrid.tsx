import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './CardGrid.css';

interface CardProps {
  link: string;
  title: string;
  imageSrc: string;
  description: string;
}

interface CardGridProps {
  cards: CardProps[];
}

const CardGrid: React.FC<CardGridProps> = ({ cards }) => {
  return (
    <Container className="my-4 card-grid">
      <Row className="justify-content-center gy-5">
        {cards.map((card, index) => (
          <Col key={index} xs={8} sm={6} md={4} lg={3} className="text-center">
            <Link to={card.link} className="text-decoration-none">
              <div className="circle-card">
                <img src={card.imageSrc} alt={card.title} className="circle-card-img" />
              </div>
              <h5 className="mt-3 card-title">{card.title}</h5>
              <p className="card-text">{card.description}</p>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CardGrid;
