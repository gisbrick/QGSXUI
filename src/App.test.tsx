const { render, screen } = require('@testing-library/react');
const App = require('./App');

test('hello world!', () => {
	render(<App />);
	const linkElement = screen.getByText(/hello world/i);
	expect(linkElement).toBeInTheDocument();
});