package folder

import (
	"context"
  "os"
	appv1alpha1 "github.com/akashbalani/csye7374-operator/pkg/apis/app/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"strings"
	"fmt"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"

	// import for aws sdks
	"encoding/json"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/aws/credentials"


  scheme "k8s.io/client-go/kubernetes/scheme"

	rest "k8s.io/client-go/rest"
	//"k8s.io/client-go/kubernetes"
	//clientset "k8s.io/client-go/tools/clientcmd"
	//"k8s.io/client-go/discovery"
	//"path/filepath"
)
type AccessKey struct {
  AccessKeyId int
	SecretAccessKey string
	UserName string
}

type AwsCred struct {
	AccessKey AccessKey
}



var log = logf.Log.WithName("controller_folder")


/**
* USER ACTION REQUIRED: This is a scaffold file intended for the user to modify with their own Controller
* business logic.  Delete these comments after modifying this file.*
 */

// Add creates a new Folder Controller and adds it to the Manager. The Manager will set fields on the Controller
// and Start it when the Manager is Started.
func Add(mgr manager.Manager) error {

	return add(mgr, newReconciler(mgr))
}

// newReconciler returns a new reconcile.Reconciler
func newReconciler(mgr manager.Manager) reconcile.Reconciler {
	return &ReconcileFolder{client: mgr.GetClient(), scheme: mgr.GetScheme()}
}

// add adds a new Controller to mgr with r as the reconcile.Reconciler
func add(mgr manager.Manager, r reconcile.Reconciler) error {
	fmt.Println("inside add")
	// Create a new controller
	c, err := controller.New("folder-controller", mgr, controller.Options{Reconciler: r})
	if err != nil {
		return err
	}

	// Watch for changes to primary resource Folder
	err = c.Watch(&source.Kind{Type: &appv1alpha1.Folder{}}, &handler.EnqueueRequestForObject{})
	if err != nil {
		return err
	}

	// TODO(user): Modify this to be the types you create that are owned by the primary resource
	// Watch for changes to secondary resource Pods and requeue the owner Folder
	err = c.Watch(&source.Kind{Type: &corev1.Pod{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &appv1alpha1.Folder{},
	})
	if err != nil {
		return err
	}

	return nil
}

// blank assignment to verify that ReconcileFolder implements reconcile.Reconciler
var _ reconcile.Reconciler = &ReconcileFolder{}

// ReconcileFolder reconciles a Folder object
type ReconcileFolder struct {
	// This client, initialized using mgr.Client() above, is a split client
	// that reads objects from the cache and writes to the apiserver
	client client.Client
	scheme *runtime.Scheme
}

// Reconcile reads that state of the cluster for a Folder object and makes changes based on the state read
// and what is in the Folder.Spec
// TODO(user): Modify this Reconcile function to implement your Controller logic.  This example creates
// a Pod as an example
// Note:
// The Controller will requeue the Request to be processed again if the returned error is non-nil or
// Result.Requeue is true, otherwise upon completion it will remove the work from the queue.
func (r *ReconcileFolder) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	reqLogger := log.WithValues("Request.Namespace", request.Namespace, "Request.Name", request.Name)
	reqLogger.Info("Reconciling Folder")

  fmt.Println("DEBUG: inside Reconcile")
	// Fetch the Folder instance
	instance := &appv1alpha1.Folder{}
	err := r.client.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Request object not found, could have been deleted after reconcile request.
			// Owned objects are automatically garbage collected. For additional cleanup logic use finalizers.
			// Return and don't requeue
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}
  fmt.Println("DEBUG: username read in reconcile function %s", instance.Spec.Username);
	// Define a new Pod object
	pod := newPodForCR(instance)
  createOperations(r, instance)


	// Set Folder instance as the owner and controller
	if err := controllerutil.SetControllerReference(instance, pod, r.scheme); err != nil {
		return reconcile.Result{}, err
	}

	// Check if this Pod already exists
	found := &corev1.Pod{}

	err = r.client.Get(context.TODO(), types.NamespacedName{Name: pod.Name, Namespace: pod.Namespace}, found)
	if err != nil && errors.IsNotFound(err) {
		reqLogger.Info("Creating a new Pod", "Pod.Namespace", pod.Namespace, "Pod.Name", pod.Name)
		err = r.client.Create(context.TODO(), pod)
		if err != nil {
			return reconcile.Result{}, err
		}

		// Pod created successfully - don't requeue
		return reconcile.Result{}, nil
	} else if err != nil {
		return reconcile.Result{}, err
	}

	// Pod already exists - don't requeue
	reqLogger.Info("Skip reconcile: Pod already exists", "Pod.Namespace", found.Namespace, "Pod.Name", found.Name)
	return reconcile.Result{}, nil
}


// PolicyDocument is our definition of our policies to be uploaded to IAM.
type PolicyDocument struct {
    Version   string
    Statement []StatementEntry
}


// StatementEntry will dictate what this policy will allow or not allow.
type StatementEntry struct {
    Effect   string
    Action   []string
    Resource string
}

// secrets implements SecretInterface
type secrets struct {
	client rest.Interface
	ns     string
}

// Get takes name of the secret, and returns the corresponding secret object, and an error if there is any.
func (c *secrets) GetSecrets(name string, options metav1.GetOptions) (result *v1.Secret, err error) {
	result = &v1.Secret{}
	err = c.client.Get().
		Namespace(c.ns).
		Resource("secrets").
		Name(name).
		VersionedParams(&options, scheme.ParameterCodec).
		Do().
		Into(result)
	return
}


// function to create IAM policy
func createIAMPolicy(username *string, AWS_ACCESS_KEY_ID_1 *string, AWS_SECRETE_KEY_ID_1 *string, bucket_1 *string){
	key_temp := strings.TrimSpace(*AWS_ACCESS_KEY_ID_1)
	secret_temp := strings.TrimSpace(*AWS_SECRETE_KEY_ID_1)
	bucket := strings.TrimSpace(*bucket_1)
	user := strings.TrimSpace(*username)

	arn := "arn:aws:s3:::" + bucket + "/" + user + "/*";
	policyName := "S3GoUserPolicy-" + user;

    //instance := &metav1.GetOptions
	//sess, err := session.NewSession(&aws.Config{
    //    Region: aws.String("us-east-1")},
    //)

    //res, err := GetSecrets("aws_cred_secret", instance)

		sess, err := session.NewSession(&aws.Config{
		 Region:      aws.String("us-east-1"),
		 Credentials: credentials.NewStaticCredentials(key_temp, secret_temp , ""),
		})

    // Create a IAM service client.
    svc := iam.New(sess)

    // Builds our policy document for IAM.
    policy := PolicyDocument{
        Version: "2012-10-17",
        Statement: []StatementEntry{
            StatementEntry{
                Effect: "Allow",
                Action: []string{
                    "s3:*",
                },
                Resource: arn,
            },
        },
    }

    b, err := json.Marshal(&policy)
    if err != nil {
        fmt.Println("Error marshaling policy", err)
        return
    }

    result, err := svc.CreatePolicy(&iam.CreatePolicyInput{
        PolicyDocument: aws.String(string(b)),
        PolicyName:     aws.String(policyName),
    })

    if err != nil {
        fmt.Println("Error", err)
        return
    }


    fmt.Println("DEBUG: New policy created", result)

}

// function to create IAM user and attach policy
func createIAMUser(username *string, policyname *string, AWS_ACCESS_KEY_ID_1 *string, AWS_SECRETE_KEY_ID_1 *string) int {

	    fmt.Println("Inside createIAMUser")
			if (username == nil || policyname == nil){
			    fmt.Println("ERROR: Invalid parameters")
					return 0;
			}

			if (len(*username) == 0 || len(*policyname) == 0){
					fmt.Println("ERROR: Empty values")
					return 0;
			}

			key_temp := strings.TrimSpace(*AWS_ACCESS_KEY_ID_1)
			secret_temp := strings.TrimSpace(*AWS_SECRETE_KEY_ID_1)

			fmt.Println("DEBUG: Username: ", *username);
			fmt.Println("DEBUG: PolicyName: ",*policyname);

	    var strPtr *string
	    var sptr *string

		  // Without the SDK's conversion functions
		  str := *username
		  strPtr = &str
		  s := *policyname
		  sptr = &s


			// go run iam_createuser.go <username>
	    // credentials from the shared credentials file ~/.aws/credentials.
	    //sess, err := session.NewSession(&aws.Config{
	      //  Region: aws.String("us-east-1")},
	    //)

			sess, err := session.NewSession(&aws.Config{
			 Region:      aws.String("us-east-1"),
			 Credentials: credentials.NewStaticCredentials(key_temp, secret_temp, ""),
			})

	    // Create a IAM service client.
	    svc := iam.New(sess)

	    out, err := svc.GetUser(&iam.GetUserInput{
	        UserName: strPtr,
				})
			fmt.Println("======================== USER ARN =============== --", out)

    if awserr, ok := err.(awserr.Error); ok && awserr.Code() == iam.ErrCodeNoSuchEntityException {
        result, err := svc.CreateUser(&iam.CreateUserInput{
            UserName: strPtr,
						PermissionsBoundary: sptr,
        })

        if err != nil {
            fmt.Println("CreateUser Error", err)
            return 0;
        }
				_, err = svc.AttachUserPolicy(&iam.AttachUserPolicyInput{
						UserName:  strPtr,
						PolicyArn: sptr,
							})
							if err != nil {
								fmt.Println("failed to attach policy to user ", err)
							}

        fmt.Println("Success", result)
    } else {
        fmt.Println("GetUser Error", err)
    }

		/* out, err = svc.GetUser(&iam.GetUserInput{
				UserName: strPtr,
			})
		fmt.Println("======================== USER ARN =============== --", out)
		fmt.Println("======================== USER ARN with AccountID =============== --", *out.User.Arn)
		account_id := strings.Split(*out.User.ARN, ":")[4]
		fmt.Println("======================== USER ARN with AccountID =============== --", account_id)
		*/
    return 0;
}

func check_if_s3_bucket_exist(username string, AWS_ACCESS_KEY_ID string, AWS_SECRETE_KEY_ID string) bool {

  fmt.Println("Check if bucket exists :", username)

	//sess, err := session.NewSession(&aws.Config{
			//Region: aws.String("us-east-1")},)

	sess, err := session.NewSession(&aws.Config{
	 Region:      aws.String("us-east-1"),
	 Credentials: credentials.NewStaticCredentials(AWS_ACCESS_KEY_ID, AWS_SECRETE_KEY_ID, ""),
	})

  svc := s3.New(sess)

	result, err := svc.ListBuckets(nil)
	if err != nil {
			os.Exit(1)
			//exitErrorf("Unable to list buckets, %v", err)
	 }

	fmt.Println("*************S3 BUCKETS LIST START************")
	for _, b := range result.Buckets {
				 fmt.Printf("* %s created on %s\n",
				 aws.StringValue(b.Name), aws.TimeValue(b.CreationDate))

				 if(aws.StringValue(b.Name) == username){
          fmt.Println("S3 bucket exists")
					 return true
				 }

	}
  fmt.Println("*************S3 BUCKETS LIST END************")
	fmt.Println("S3 bucket doesnt exist")
	return false
}


// function to generate Access key
func generateAccessKey(username *string, AWS_ACCESS_KEY_ID_1 *string, AWS_SECRETE_KEY_ID_1 *string, kubeClient client.Client,namespace string){


	var user string;
	user = *username;
	fmt.Println("==================  generateAccessKey function called with user name =========== " , user)

	key_temp := strings.TrimSpace(*AWS_ACCESS_KEY_ID_1)
	secret_temp := strings.TrimSpace(*AWS_SECRETE_KEY_ID_1)

	sess, err := session.NewSession(&aws.Config{
        Region: aws.String("us-east-1"),
				Credentials: credentials.NewStaticCredentials(key_temp, secret_temp, ""),
			},)

    // Create a IAM service client.
    svc := iam.New(sess)

		result, err := svc.CreateAccessKey(&iam.CreateAccessKeyInput{
			UserName: aws.String(user),
		})


		if err != nil {
    if aerr, ok := err.(awserr.Error); ok {
        switch aerr.Code() {
        case iam.ErrCodeNoSuchEntityException:
            fmt.Println(iam.ErrCodeNoSuchEntityException, aerr.Error())
        case iam.ErrCodeLimitExceededException:
            fmt.Println(iam.ErrCodeLimitExceededException, aerr.Error())
        case iam.ErrCodeServiceFailureException:
            fmt.Println(iam.ErrCodeServiceFailureException, aerr.Error())
        default:
            fmt.Println(aerr.Error())
        }
    } else {
        // Print the error, cast err to awserr.Error to get the Code and
        // Message from an error.
        fmt.Println(err.Error())
    }
    return
	}
  fmt.Println("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
  fmt.Println(result)
	fmt.Println(*result.AccessKey.AccessKeyId)
	fmt.Println(*result.AccessKey.SecretAccessKey)

	fmt.Println("=============== creating secret  ================")
	secret := corev1.Secret{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Secret",
			APIVersion: "apps/v1beta1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      *result.AccessKey.UserName,
			Namespace: namespace,
		},
		Data: map[string][]byte{
			"aws-access-key": []byte(*result.AccessKey.AccessKeyId),
			"aws-secret-key": []byte(*result.AccessKey.SecretAccessKey),
		},
		Type: "Opaque",
	}
	 err = kubeClient.Create(context.TODO(), &secret)
	//secretOut,err := kubeClient.clientset.CoreV1().Secrets("default").Create(&secret)

	if err != nil {
		fmt.Println("ERROR:", err)
	}

		fmt.Println("Secret :", err)




	/* secretOut, err := kubeClient.clientset.CoreV1().Secrets(cr.Namespace).Create(&secret)
	if err != nil {
		fmt.Println("ERROR:", err)
	}
	*/




	fmt.Println("--=================== Finish secret generation ====================---- ")

}

// function to create s3 bucket and put object
func createS3Bucket(username *string, AWS_ACCESS_KEY_ID_1 *string, AWS_SECRETE_KEY_ID_1 *string, bucket_1 *string)  {
		var bucketPtr *string
		var keyPtr *string
		var user string;
		user = *username;

		//var bucketTemp string;
		//bucketTemp = *bucket_1;

		fmt.Println("BUCKET_NAME_1 inside createS3Bucket : ", *bucket_1)
		fmt.Println("BUCKET_NAME_1 inside createS3Bucket  &bucket_1 : ", *(&bucket_1))
		fmt.Println("BUCKET_NAME_1 inside createS3Bucket bucket_1 : ", bucket_1)
		//bucket := bucketTemp
		bucketTemp := strings.TrimSpace(*bucket_1)
		bucketPtr = &bucketTemp

		key_temp := strings.TrimSpace(*AWS_ACCESS_KEY_ID_1)
		secret_temp := strings.TrimSpace(*AWS_SECRETE_KEY_ID_1)

		fmt.Println("bucket ")

    key := user + "/"
		keyPtr = &key


    // Initialize a session in us-west-2 that the SDK will use to load
    // credentials from the shared credentials file ~/.aws/credentials.
    //sess, err := session.NewSession(&aws.Config{
      //  Region: aws.String("us-eas1-1")},
    //)

		sess, err := session.NewSession(&aws.Config{
    Region:      aws.String("us-east-1"),
    Credentials: credentials.NewStaticCredentials(key_temp, secret_temp, ""),
    })

    // Create S3 service client
    svc := s3.New(sess)

    if (check_if_s3_bucket_exist(bucketTemp,key_temp,secret_temp) != true) {
			fmt.Println("Creating new S3 bucket")

      _, err = svc.CreateBucket(&s3.CreateBucketInput{
          Bucket: bucketPtr,
      })
      if err != nil {
          fmt.Println("Failed to create bucket", err)
          return
      }

      if err = svc.WaitUntilBucketExists(&s3.HeadBucketInput{Bucket: bucketPtr}); err != nil {
          fmt.Println("Failed to wait for bucket to exist %s, %s\n", bucketTemp, err)
          return
      }

			 fmt.Println("Successfully created bucket \n", bucketTemp)
     }
    _, err = svc.PutObject(&s3.PutObjectInput{
        Bucket: bucketPtr,
        Key:    keyPtr,
    })
    if err != nil {
        fmt.Println("Failed to upload data to %s/%s, %s\n", bucketTemp, key, err)
        return
    }


    fmt.Println("Successfully uploaded/created folder", key)
}


//
// GetSecret returns a secret based on a secretName and namespace.
func GetSecret(kubeClient client.Client, secretName, namespace string) (*corev1.Secret, error) {

	s := &corev1.Secret{}
	fmt.Println(" ====-  In GetSecret function -=====")


	err := kubeClient.Get(context.TODO(), types.NamespacedName{Name: secretName, Namespace: namespace}, s)

	if err != nil {
		return nil, err
	}

	return s, nil
}

// Function implements core logic
func createOperations(r *ReconcileFolder ,cr *appv1alpha1.Folder){
	fmt.Println("-======== Inside createOperations function =========- \n ")

	crtSecret, err := GetSecret(r.client, cr.Spec.UserSecret.Name, cr.Namespace)
	fmt.Println(cr.Spec.Username)
	fmt.Println("User Secret : " , cr.Spec.UserSecret)
	fmt.Println("========================  cr.Status.Setupcomplete  ======================= ")
	fmt.Println(cr.Status.Setupcomplete)
	//fmt.Println(crtSecret)

	if crtSecret != nil{

		fmt.Println(" aws_access_key_id : " , string(crtSecret.Data["aws_access_key_id"])) // need to de-code this
		fmt.Println(" aws_secret_access_key : " , string(crtSecret.Data["aws_secret_access_key"])) // need to de-code this
		fmt.Println(" s3_bucker_name : " , string(crtSecret.Data["s3_bucker_name"])) // need to de-code this
	}

	//fmt.Println(cr.Spec.UserSecret.aws_access_key_id)
	//fmt.Println(cr.Spec.UserSecret.aws_secret_access_key)
	//fmt.Println(cr.Spec.UserSecret.s3_bucker_name)
	//fmt.Println(crtSecret)
	fmt.Println(err) // useless but don't remove this line


	//data := crtSecret.Data[corev1.TLSCertKey]
	// if data == nil {
	// 	return nil, fmt.Errorf("certificate data was not found in secret %v", cr.Spec.CertificateSecret.Name)
	// }

if crtSecret != nil{
	bucketName := string(crtSecret.Data["s3_bucker_name"])
	aws_access_key_id := string(crtSecret.Data["aws_access_key_id"])
	aws_secret_access_key := string(crtSecret.Data["aws_secret_access_key"])

  fmt.Println("-======== creating IAM Policy =========- \n ")
	createIAMPolicy(&cr.Spec.Username,&aws_access_key_id,&aws_secret_access_key, &bucketName)

	fmt.Println("-======== creating IAM User and attaching policy =========-  \n")
	policyArn := "arn:aws:iam::786343473782:policy/S3GoUserPolicy-" + cr.Spec.Username;
	createIAMUser(&cr.Spec.Username, &policyArn, &aws_access_key_id,&aws_secret_access_key)

	fmt.Println("-======== creating S3 bucket and creating folder inside S3 bucket=========- \n ")

	fmt.Println("BEFORE CALLING createS3Bucket : ", bucketName)
	createS3Bucket(&cr.Spec.Username, &aws_access_key_id,&aws_secret_access_key, &bucketName)

	fmt.Println("-====  Generating access key for IAM user =====-")
	//crtSecretUser, err := generateAccessKeyUser(r.client, &cr.Spec.Username, &aws_access_key_id,&aws_secret_access_key)
	generateAccessKey(&cr.Spec.Username, &aws_access_key_id,&aws_secret_access_key, r.client,cr.Namespace)

	fmt.Println("======================== setting cr.Status.Setupcomplete = True  ======================= ")
	cr.Status.Setupcomplete = true;
	fmt.Println(cr.Status.Setupcomplete)
	}
}


// newPodForCR returns a busybox pod with the same name/namespace as the cr
func newPodForCR(cr *appv1alpha1.Folder) *corev1.Pod {
	labels := map[string]string{
		"app": cr.Name,
	}

  fmt.Println("inside newPodForCR")

	fmt.Println("******** %s", cr.Spec)

	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      cr.Name + "-pod",
			Namespace: cr.Namespace,
			Labels:    labels,
		},
		Spec: corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Name:    "busybox",
					Image:   "busybox",
					Command: []string{"sleep", "3600"},
				},
			},
		},
	}
}
