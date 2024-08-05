const isValidPassword = require('../passwordValidator');

test('Senha válida', () => {
    expect(isValidPassword("AbTp9!fok")).toBe(true);
});

test('Tamanho da senha inválido', () => {
    expect(isValidPassword("AbTp9!fo")).toBe(false);
});

test('Senha inválida: sem número', () => {
    expect(isValidPassword("AbTp!fok")).toBe(false);
});

test('Senha inválida: sem letra minúscula', () => {
    expect(isValidPassword("ABTP9!FOK")).toBe(false);
});

test('Senha inválida: sem letra maiúscula', () => {
    expect(isValidPassword("abtp9!fok")).toBe(false);
});

test('Senha inválida: sem caractere especial', () => {
    expect(isValidPassword("AbTp9fok")).toBe(false);
});

test('Senha inválida: caracteres repetidos', () => {
    expect(isValidPassword("AbTp9!foo")).toBe(false);
});

test('Senha inválida: possui espaço em branco', () => {
    expect(isValidPassword("AbTp9 fok")).toBe(false);
});

test('Exemplo case 1 -> password: ""', () => {
    expect(isValidPassword("")).toBe(false);
});

test('Exemplo case 2 -> password: "aa"', () => {
    expect(isValidPassword("aa")).toBe(false);
});

test('Exemplo case 3 -> password: "ab"', () => {
    expect(isValidPassword("ab")).toBe(false);
});

test('Exemplo case 4 -> password: "AAAbbbCc"', () => {
    expect(isValidPassword("AAAbbbCc")).toBe(false);
});

test('Exemplo case 5 -> password: "AbTp9!foo"', () => {
    expect(isValidPassword("AbTp9!foo")).toBe(false);
});

test('Exemplo case 6 -> password: "AbTp9!foA"', () => {
    expect(isValidPassword("AbTp9!foA")).toBe(false);
});

test('Exemplo case 7 -> password: "AbTp9 fok"', () => {
    expect(isValidPassword("AbTp9 fok")).toBe(false);
});

test('Exemplo case 8 -> password: "AbTp9!fok"', () => {
    expect(isValidPassword("AbTp9!fok")).toBe(true);
});

