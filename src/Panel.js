import React, { useState, useEffect } from "react";
import {
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { db, storage } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export const Panel = () => {
  const [view, setView] = useState("posts");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]); // Array para múltiples imágenes
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Estados para el modal de agregar post
  const [addPostModalOpen, setAddPostModalOpen] = useState(false);
  const [addPostModalMessage, setAddPostModalMessage] = useState("");

  // Estados para el modal de eliminar cuenta
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Estados para el modal de eliminar post
  const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);

  // Estados para el modal de creación de usuario
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserModalMessage, setCreateUserModalMessage] = useState("");

  // Estados para el modal de error de dominio de correo
  const [emailDomainErrorModalOpen, setEmailDomainErrorModalOpen] =
    useState(false);
  const [emailDomainErrorMessage, setEmailDomainErrorMessage] = useState("");

  // Estados para el modal de error de contraseña
  const [passwordErrorModalOpen, setPasswordErrorModalOpen] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();

  // Lista de dominios permitidos
  const allowedDomains = [
    "gmail.com",
    "gmail.es",
    "hotmail.com",
    "outlook.com",
    "outlook.es",
    "yahoo.com",
    "yahoo.es",
  ];

  // Expresión regular para validar la contraseña
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    const fetchDeletedAccounts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "deleteAccount"));
        const accounts = querySnapshot.docs.map((doc, index) => ({
          id: doc.id,
          index: index + 1,
          deletedAt: new Date(doc.data().deletedAt).toLocaleString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          phoneNumber: doc.data().phoneNumber,
        }));
        setDeletedAccounts(accounts);
      } catch (error) {
        console.error("Error al obtener cuentas eliminadas:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const postsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      } catch (error) {
        console.error("Error al obtener posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (view === "accounts") {
      fetchDeletedAccounts();
    } else if (view === "deletePosts") {
      fetchPosts();
    }
  }, [view]);

  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(collection(db, "posts"));
      const postsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsArray);
    };

    fetchPosts();
  }, []);

  const openEditModal = (post) => {
    setSelectedPost(post);
    setNewTitle(post.title);
    setNewDescription(post.description);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (selectedPost) {
      const postRef = doc(db, "posts", selectedPost.id);
      await updateDoc(postRef, {
        title: newTitle,
        description: newDescription,
      });

      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, title: newTitle, description: newDescription }
            : post
        )
      );
      setModalVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setCreateUserModalMessage("");
    setEmailDomainErrorMessage("");
    setPasswordErrorMessage("");

    // Extraer el dominio del correo y convertirlo a minúsculas
    const emailDomain = email.split("@")[1]?.toLowerCase(); // Convertir a minúsculas

    // Validar el dominio del correo electrónico
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      setEmailDomainErrorMessage(
        "Inténtalo con otro correo. Dominio no permitido."
      );
      setEmailDomainErrorModalOpen(true);
      return;
    }

    // Validar la contraseña
    if (!passwordRegex.test(password)) {
      setPasswordErrorMessage(
        "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial."
      );
      setPasswordErrorModalOpen(true);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setCreateUserModalMessage("Usuario creado exitosamente.");
      setEmail("");
      setPassword("");
      setCreateUserModalOpen(true); // Abrir el modal de éxito
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    // if (!title || !description || !image) {
    if (!title || !description || images.length === 0) {
      setAddPostModalMessage("Por favor, completa todos los campos.");
      setAddPostModalOpen(true);
      return;
    }

    setUploading(true);
    /*
    try {
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", "wvdro59z");
      data.append("cloud_name", "dn2vjqp97");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dn2vjqp97/image/upload",
        {
          method: "POST",
          body: data,
        }
      );
      const result = await response.json();

      const compressedImageUrl = result.url.replace(
        "/upload/",
        "/upload/q_auto/"
      );

      const imageResponse = await fetch(compressedImageUrl);
      const blob = await imageResponse.blob();

      const timestamp = Date.now();
      const fileExtension = image.name.split(".").pop();
      const fileName = `${timestamp}.${fileExtension}`;

      const imageRef = ref(storage, `posts/${fileName}`);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "posts"), {
        title,
        description,
        imageUrl,
        createdAt: new Date(),
      });

      setTitle("");
      setDescription("");
      setImage(null);
      setAddPostModalMessage("Post agregado con éxito!");
    } catch (error) {
      console.error("Error al subir el post:", error);
      setAddPostModalMessage("Hubo un error al agregar el post.");
    } finally {
      setUploading(false);
      setAddPostModalOpen(true);
    }
  };*/

    try {
      // Subir cada imagen a Cloudinary y obtener sus URLs comprimidas
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const data = new FormData();
          data.append("file", image);
          data.append("upload_preset", "wvdro59z"); // Tu upload preset de Cloudinary
          data.append("cloud_name", "dn2vjqp97"); // Tu cloud name de Cloudinary

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dn2vjqp97/image/upload",
            {
              method: "POST",
              body: data,
            }
          );
          const result = await response.json();
          return result.secure_url.replace("/upload/", "/upload/q_auto/");
          //return result.url.replace("/upload/", "/upload/q_auto/"); // Asegurar compresión con q_auto
        })
      );

      // Subir las imágenes comprimidas a Firebase Storage
      const uploadedImageUrls = await Promise.all(
        imageUrls.map(async (imageUrl, index) => {
          const imageResponse = await fetch(imageUrl);
          const blob = await imageResponse.blob();
          const timestamp = Date.now();
          const fileExtension = images[index].name.split(".").pop();
          const fileName = `${timestamp}_${index}.${fileExtension}`;
          const imageRef = ref(storage, `posts/${fileName}`);
          await uploadBytes(imageRef, blob);
          return await getDownloadURL(imageRef);
        })
      );

      // Guardar el post en Firestore con las URLs de las imágenes
      await addDoc(collection(db, "posts"), {
        title,
        description,
        imageUrl: uploadedImageUrls, // Guardar un array de URLs
        createdAt: new Date(),
      });

      // Limpiar el formulario
      setTitle("");
      setDescription("");
      setImages([]);
      setAddPostModalMessage("Post agregado con éxito!");
    } catch (error) {
      console.error("Error al subir el post:", error);
      setAddPostModalMessage("Hubo un error al agregar el post.");
    } finally {
      setUploading(false);
      setAddPostModalOpen(true);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      const postToDelete = posts.find((post) => post.id === deletePostId);
      if (postToDelete && postToDelete.imageUrl) {
        const imageRef = ref(storage, postToDelete.imageUrl);
        await deleteObject(imageRef);
      }

      await deleteDoc(doc(db, "posts", deletePostId));
      setPosts(posts.filter((post) => post.id !== deletePostId));
      setAddPostModalMessage("Post eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar el post:", error);
      setAddPostModalMessage("Hubo un error al eliminar el post.");
    } finally {
      setDeletePostModalOpen(false);
      setDeletePostId(null);
    }
  };

  return (
    <div className="panel-container">
      <div className="sidebar">
        <h2>PANEL ADMINISTRADOR</h2>
        <button onClick={() => setView("posts")}>Post</button>
        <button onClick={() => setView("accounts")}>Cuentas a Eliminar</button>
        <button onClick={() => setView("createUser")}>Crear Usuario</button>
        <button onClick={() => setView("deletePosts")}>Editar Post</button>
        <button onClick={handleLogout}>Salir</button>

        <footer className="sidebar-footer">
          <a
            href="https://www.facebook.com/xalertec"
            target="_blank"
            rel="noopener noreferrer"
          >
            XALER
          </a>
        </footer>
      </div>

      <div className="content">
        {view === "posts" && (
          <>
            <h2>Agregar Post</h2>
            <form onSubmit={handleAddPost}>
              <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                multiple // Permitir múltiples archivos
                onChange={(e) => setImages([...e.target.files])} // Guardar todas las imágenes seleccionadas
              />
              <button type="submit" disabled={uploading}>
                {uploading ? "Subiendo..." : "Agregar Post"}
              </button>
            </form>
          </>
        )}

        {view === "accounts" && (
          <>
            <h2>Cuentas Eliminadas</h2>
            {loading ? (
              <div className="loader">Cargando...</div>
            ) : (
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha Eliminación</th>
                      <th>Número de Teléfono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedAccounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.index}</td>
                        <td>{account.deletedAt}</td>
                        <td>{account.phoneNumber}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setDeleteAccountModalOpen(true);
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deleteAccountModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Confirmar Eliminación</h3>
                  <p>¿Seguro que deseas eliminar esta cuenta?</p>
                  <div className="modal-buttons">
                    <button onClick={() => setDeleteAccountModalOpen(false)}>
                      Cancelar
                    </button>
                    <button>Confirmar</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {view === "createUser" && (
          <>
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser}>
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Crear Usuario</button>
            </form>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          </>
        )}

        {view === "deletePosts" && (
          <>
            <h2>Eliminar Posts</h2>
            {loading ? (
              <div className="loader">Cargando...</div>
            ) : (
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título del Post</th>
                      <th>Descripción del Post</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, index) => (
                      <tr key={post.id}>
                        <td>{index + 1}</td>
                        <td>{post.title}</td>
                        <td>{post.description}</td>
                        <td>
                          <div className="modal-buttons">
                            <button onClick={() => openEditModal(post)}>
                              Editar
                            </button>

                            <button
                              onClick={() => {
                                setDeletePostId(post.id);
                                setDeletePostModalOpen(true);
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deletePostModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Confirmar Eliminación</h3>
                  <p>¿Seguro que deseas eliminar este post?</p>
                  <div className="modal-buttons">
                    <button onClick={() => setDeletePostModalOpen(false)}>
                      Cancelar
                    </button>
                    <button onClick={handleDeletePost}>Confirmar</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {addPostModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <p>{addPostModalMessage}</p>
            <button onClick={() => setAddPostModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {createUserModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <p>{createUserModalMessage}</p>
            <button onClick={() => setCreateUserModalOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {emailDomainErrorModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <p>{emailDomainErrorMessage}</p>
            <button onClick={() => setEmailDomainErrorModalOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {passwordErrorModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <p>{passwordErrorMessage}</p>
            <button onClick={() => setPasswordErrorModalOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h2>Editar Publicación</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nuevo título"
            />
            <br />
            <br />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Nueva descripción"
            />
            <div className="modal-buttons">
              <button onClick={() => setModalVisible(false)} className="cancel">
                Cancelar
              </button>

              <button onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
