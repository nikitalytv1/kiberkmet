import * as userService from "../services/user.service.js";

export async function getUsers(_req, res) {
  try {
    return res.json(await userService.findAll());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

export async function registerUser(req, res) {
  try {
    const user = await userService.createUser(req.body.name, req.body.email, req.body.password);
    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function loginUser(req, res) {
  try {
    const result = await userService.authenticate(req.body.email, req.body.password);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function refreshToken(req, res) {
  try {
    const tokens = await userService.rotateTokens(req.body.refreshToken);
    return res.json(tokens);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await userService.updateById(req.params.id, req.body);
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    await userService.deleteById(req.params.id);
    return res.json({ message: "Uporabnik izbrisan." });
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const user = await userService.updateProfile(req.user.userId, req.body);
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    await userService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    return res.json({ message: "Geslo uspešno posodobljeno." });
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function logoutUser(_req, res) {
  return res.json({ message: "Odjava uspešna." });
}

export async function getMe(req, res) {
  try {
    const user = await userService.findById(req.user.userId);
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}
