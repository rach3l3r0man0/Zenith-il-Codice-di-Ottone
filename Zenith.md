## Project Backstory & Concept
Zenith is a city suspended in the sky, powered by the antigravity core of the Clock Tower, also known as the "Brass Heart". The tower was designed by the lead engineer, Ettore Meucci, and the Player.

The plot follows a political crisis: the Mayor intends to seize the Tower's mechanisms to sell the Core's energy to foreign nations, a move that would destabilize Zenith’s antigravity balance and lead to the city's destruction. To prevent this, Ettore Meucci has sabotaged and locked the tower using its own internal mechanisms.

# Gameplay & Logic
The player must infiltrate the tower and solve the security overrides to save the city.

* User-Centric Narrative: The system dynamically integrates the player's data. After registration and login, the application uses the stored username to identify the player as the only engineer capable of repairing the mechanism.

* State Management: The game tracks the player's progress through the tower's security layers using PHP session management.

* Database Integration: Player credentials, game states, and "Brass Heart" status are managed via a relational MySQL database.
